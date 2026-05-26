use super::{curl_parser, json_path, template::TemplateVars};
use crate::commands::provider::StreamRequest;
use futures_util::StreamExt;
use reqwest::Client;
use serde::Serialize;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::oneshot::Receiver;

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum StreamEvent {
    Chunk { data: String },
    Done,
    Error { data: String },
}

pub async fn execute_stream(
    app: AppHandle,
    req: StreamRequest,
    cancel_rx: Receiver<()>,
) -> (String, Result<(), String>) {
    let id = req.request_id.clone();
    let result = do_stream(app, req, cancel_rx).await;
    (id, result)
}

async fn do_stream(
    app: AppHandle,
    req: StreamRequest,
    mut cancel_rx: Receiver<()>,
) -> Result<(), String> {
    let parsed = curl_parser::parse_curl(&req.curl_template).map_err(|e| e.to_string())?;

    let vars = TemplateVars {
        api_key: req.api_key.clone(),
        text: req.text.clone(),
        system_prompt: req.system_prompt.clone(),
        model: req.model.clone(),
        image: req.image_data_url.clone(),
    };

    let (headers, body) =
        super::template::substitute_parsed(&parsed.headers, &parsed.body, &vars);

    let client = Client::builder()
        .connect_timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let mut builder = match parsed.method.as_str() {
        "GET" => client.get(&parsed.url),
        "PUT" => client.put(&parsed.url),
        "PATCH" => client.patch(&parsed.url),
        _ => client.post(&parsed.url),
    };

    for (k, v) in &headers {
        builder = builder.header(k, v);
    }
    if let Some(body_str) = body {
        builder = builder.body(body_str);
    }

    // Race the connect against the cancel signal so the user can abort
    // before we even get a response (e.g. when localhost is unreachable).
    let response = tokio::select! {
        _ = &mut cancel_rx => {
            emit(&app, &req.request_id, StreamEvent::Done);
            return Ok(());
        }
        res = builder.send() => match res {
            Err(e) => {
                emit(&app, &req.request_id, StreamEvent::Error { data: e.to_string() });
                return Ok(());
            }
            Ok(r) => r,
        }
    };

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let body = response
            .text()
            .await
            .unwrap_or_else(|_| "(no body)".to_string());
        let snippet = body.chars().take(300).collect::<String>();
        let event = StreamEvent::Error {
            data: format!("HTTP {status}: {snippet}"),
        };
        emit(&app, &req.request_id, event);
        return Ok(());
    }

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();

    if content_type.contains("event-stream") {
        // SSE format: lines like "data: {...}"
        let mut stream = response.bytes_stream();
        let mut buf = String::new();
        loop {
            tokio::select! {
                _ = &mut cancel_rx => {
                    emit(&app, &req.request_id, StreamEvent::Done);
                    return Ok(());
                }
                chunk = stream.next() => {
                    match chunk {
                        None => break,
                        Some(Err(e)) => {
                            emit(&app, &req.request_id, StreamEvent::Error { data: e.to_string() });
                            return Ok(());
                        }
                        Some(Ok(bytes)) => {
                            buf.push_str(&String::from_utf8_lossy(&bytes));
                            while let Some(newline) = buf.find('\n') {
                                let line = buf[..newline].trim().to_string();
                                buf = buf[newline + 1..].to_string();
                                if let Some(data) = line.strip_prefix("data: ") {
                                    if data == "[DONE]" {
                                        break;
                                    }
                                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(data) {
                                        if let Some(text) = json_path::extract(&val, &req.response_path) {
                                            if !text.is_empty() {
                                                emit(&app, &req.request_id, StreamEvent::Chunk { data: text });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } else if content_type.contains("x-ndjson") || content_type.contains("ndjson") {
        // NDJSON format (Ollama): one JSON object per line
        let mut stream = response.bytes_stream();
        let mut buf = String::new();
        loop {
            tokio::select! {
                _ = &mut cancel_rx => {
                    emit(&app, &req.request_id, StreamEvent::Done);
                    return Ok(());
                }
                chunk = stream.next() => {
                    match chunk {
                        None => break,
                        Some(Err(e)) => {
                            emit(&app, &req.request_id, StreamEvent::Error { data: e.to_string() });
                            return Ok(());
                        }
                        Some(Ok(bytes)) => {
                            buf.push_str(&String::from_utf8_lossy(&bytes));
                            while let Some(newline) = buf.find('\n') {
                                let line = buf[..newline].trim().to_string();
                                buf = buf[newline + 1..].to_string();
                                if line.is_empty() { continue; }
                                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                                    // Ollama signals done with {"done":true}
                                    if val.get("done").and_then(|v| v.as_bool()) == Some(true) {
                                        break;
                                    }
                                    if let Some(text) = json_path::extract(&val, &req.response_path) {
                                        if !text.is_empty() {
                                            emit(&app, &req.request_id, StreamEvent::Chunk { data: text });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } else {
        // Non-streaming: read full body, extract with json_path
        let body_str = response.text().await.map_err(|e| e.to_string())?;
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&body_str) {
            if let Some(text) = json_path::extract(&val, &req.response_path) {
                emit(&app, &req.request_id, StreamEvent::Chunk { data: text });
            }
        } else {
            emit(
                &app,
                &req.request_id,
                StreamEvent::Chunk {
                    data: body_str,
                },
            );
        }
    }

    emit(&app, &req.request_id, StreamEvent::Done);
    Ok(())
}

fn emit(app: &AppHandle, request_id: &str, event: StreamEvent) {
    let event_name = format!("stream://{request_id}");
    let _ = app.emit(&event_name, event);
}
