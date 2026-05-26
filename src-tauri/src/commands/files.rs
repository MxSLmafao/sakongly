use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use std::path::Path;

const MAX_ATTACHMENTS: usize = 6;
const MAX_FILE_SIZE_BYTES: u64 = 20 * 1024 * 1024; // 20MB

#[derive(Debug, Serialize)]
pub struct AttachmentInfo {
    pub path: String,
    pub name: String,
    pub mime: String,
    pub size: u64,
    pub data_url: Option<String>, // base64 data URL for images
}

#[tauri::command]
pub async fn attach_file(
    paths: Vec<String>,
    current_count: usize,
) -> Result<Vec<AttachmentInfo>, String> {
    if current_count + paths.len() > MAX_ATTACHMENTS {
        return Err(format!(
            "Maximum {} attachments allowed, you already have {}",
            MAX_ATTACHMENTS, current_count
        ));
    }

    let mut results = Vec::new();
    for path_str in paths {
        let path = Path::new(&path_str);
        let meta = std::fs::metadata(path).map_err(|e| format!("Cannot read {path_str}: {e}"))?;

        if meta.len() > MAX_FILE_SIZE_BYTES {
            return Err(format!(
                "{} exceeds 20MB limit",
                path.file_name().unwrap_or_default().to_string_lossy()
            ));
        }

        let mime = mime_from_path(path);
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();

        let data_url = if mime.starts_with("image/") {
            let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
            Some(format!("data:{mime};base64,{}", STANDARD.encode(&bytes)))
        } else {
            None
        };

        results.push(AttachmentInfo {
            path: path_str,
            name,
            mime,
            size: meta.len(),
            data_url,
        });
    }
    Ok(results)
}

fn mime_from_path(path: &Path) -> String {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("pdf") => "application/pdf",
        Some("txt") | Some("md") => "text/plain",
        Some("json") => "application/json",
        Some("csv") => "text/csv",
        _ => "application/octet-stream",
    }
    .to_string()
}
