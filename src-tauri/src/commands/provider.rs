use crate::ai;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use tauri::AppHandle;

static CANCEL_TOKENS: Lazy<Mutex<HashMap<String, tokio::sync::oneshot::Sender<()>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Debug, Serialize)]
pub struct CurlValidation {
    pub valid: bool,
    pub error: Option<String>,
    pub method: Option<String>,
    pub url: Option<String>,
}

#[tauri::command]
pub fn validate_curl_template(curl: String) -> CurlValidation {
    match ai::curl_parser::parse_curl(&curl) {
        Ok(parsed) => CurlValidation {
            valid: true,
            error: None,
            method: Some(parsed.method),
            url: Some(parsed.url),
        },
        Err(e) => CurlValidation {
            valid: false,
            error: Some(e.to_string()),
            method: None,
            url: None,
        },
    }
}

#[derive(Debug, Deserialize)]
pub struct StreamRequest {
    pub request_id: String,
    pub curl_template: String,
    pub api_key: String,
    pub model: String,
    pub system_prompt: String,
    pub text: String,
    pub image_data_url: Option<String>,
    pub response_path: String,
    pub streaming: bool,
}

#[tauri::command]
pub async fn ai_stream(app: AppHandle, req: StreamRequest) -> Result<(), String> {
    let (tx, rx) = tokio::sync::oneshot::channel::<()>();

    {
        let mut tokens = CANCEL_TOKENS.lock().map_err(|e| e.to_string())?;
        tokens.insert(req.request_id.clone(), tx);
    }

    let result = ai::streamer::execute_stream(app.clone(), req, rx).await;

    {
        let mut tokens = CANCEL_TOKENS.lock().unwrap_or_else(|p| p.into_inner());
        tokens.remove(&result.0);
    }

    result.1
}

#[tauri::command]
pub fn ai_cancel(request_id: String) -> bool {
    let mut tokens = CANCEL_TOKENS.lock().unwrap_or_else(|p| p.into_inner());
    if let Some(tx) = tokens.remove(&request_id) {
        let _ = tx.send(());
        true
    } else {
        false
    }
}
