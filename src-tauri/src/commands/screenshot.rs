use crate::screenshot;
use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use std::env;

#[derive(Debug, Serialize)]
pub struct CaptureResult {
    pub data_url: String,
    pub width: u32,
    pub height: u32,
    pub temp_path: String,
}

#[tauri::command]
pub async fn capture_fullscreen(monitor_index: usize) -> Result<CaptureResult, String> {
    let session = env::var("XDG_SESSION_TYPE").unwrap_or_default();
    if session.contains("wayland") {
        screenshot::wayland::capture_fullscreen_portal().await
    } else {
        screenshot::x11::capture_fullscreen_xcap(monitor_index).await
    }
}

#[tauri::command]
pub async fn start_region_capture(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    monitor_index: usize,
) -> Result<CaptureResult, String> {
    let session = env::var("XDG_SESSION_TYPE").unwrap_or_default();
    if session.contains("wayland") {
        // On Wayland the portal handles the region UI itself; this command
        // receives the coords it returned and crops the last fullscreen capture.
        screenshot::wayland::capture_region_portal(x, y, width, height).await
    } else {
        screenshot::x11::capture_region_xcap(monitor_index, x, y, width, height).await
    }
}

#[allow(dead_code)]
pub fn image_to_data_url(path: &std::path::Path) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    let mime = if path.extension().and_then(|e| e.to_str()) == Some("png") {
        "image/png"
    } else {
        "image/jpeg"
    };
    Ok(format!("data:{mime};base64,{}", STANDARD.encode(&bytes)))
}
