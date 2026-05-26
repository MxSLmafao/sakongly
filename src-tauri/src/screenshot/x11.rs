use crate::commands::screenshot::CaptureResult;
use base64::{engine::general_purpose::STANDARD, Engine};
use image::ImageFormat;
use std::io::Cursor;
use xcap::Monitor;

pub async fn capture_fullscreen_xcap(monitor_index: usize) -> Result<CaptureResult, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors
        .get(monitor_index)
        .ok_or_else(|| format!("Monitor {monitor_index} not found"))?;

    let image = monitor.capture_image().map_err(|e| e.to_string())?;
    let (width, height) = (image.width(), image.height());

    let mut bytes: Vec<u8> = Vec::new();
    image
        .write_to(&mut Cursor::new(&mut bytes), ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let temp_path = write_temp_png(&bytes)?;
    let data_url = format!("data:image/png;base64,{}", STANDARD.encode(&bytes));

    Ok(CaptureResult {
        data_url,
        width,
        height,
        temp_path,
    })
}

pub async fn capture_region_xcap(
    monitor_index: usize,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<CaptureResult, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors
        .get(monitor_index)
        .ok_or_else(|| format!("Monitor {monitor_index} not found"))?;

    let full = monitor.capture_image().map_err(|e| e.to_string())?;
    let scale = monitor.scale_factor();

    // Apply per-monitor scale to convert logical → physical pixels
    let px = ((x - monitor.x()) as f32 * scale) as u32;
    let py = ((y - monitor.y()) as f32 * scale) as u32;
    let pw = (width as f32 * scale) as u32;
    let ph = (height as f32 * scale) as u32;

    let cropped = image::imageops::crop_imm(&full, px, py, pw, ph).to_image();
    let (cw, ch) = (cropped.width(), cropped.height());

    let mut bytes: Vec<u8> = Vec::new();
    cropped
        .write_to(&mut Cursor::new(&mut bytes), ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let temp_path = write_temp_png(&bytes)?;
    let data_url = format!("data:image/png;base64,{}", STANDARD.encode(&bytes));

    Ok(CaptureResult {
        data_url,
        width: cw,
        height: ch,
        temp_path,
    })
}

fn write_temp_png(bytes: &[u8]) -> Result<String, String> {
    let tmp = std::env::temp_dir().join(format!(
        "sakongly_cap_{}.png",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    ));
    std::fs::write(&tmp, bytes).map_err(|e| e.to_string())?;
    Ok(tmp.to_string_lossy().into_owned())
}
