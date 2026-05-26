use crate::commands::screenshot::CaptureResult;
use base64::{engine::general_purpose::STANDARD, Engine};

pub async fn capture_fullscreen_portal() -> Result<CaptureResult, String> {
    #[cfg(target_os = "linux")]
    {
        use ashpd::desktop::screenshot::Screenshot;
        use ashpd::WindowIdentifier;

        let response = Screenshot::request()
            .interactive(false)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .response()
            .map_err(|e| e.to_string())?;

        let path = response
            .uri()
            .to_file_path()
            .map_err(|_| "portal returned non-file URI")?;

        let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
        let img = image::load_from_memory(&bytes).map_err(|e| e.to_string())?;
        let (width, height) = (img.width(), img.height());
        let data_url = format!("data:image/png;base64,{}", STANDARD.encode(&bytes));

        Ok(CaptureResult {
            data_url,
            width,
            height,
            temp_path: path.to_string_lossy().into_owned(),
        })
    }
    #[cfg(not(target_os = "linux"))]
    Err("Wayland portal not available on this platform".to_string())
}

pub async fn capture_region_portal(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<CaptureResult, String> {
    // The portal returns a full screenshot; we crop to the user-selected region.
    let full = capture_fullscreen_portal().await?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(full.data_url.split(',').nth(1).unwrap_or(""))
        .map_err(|e| e.to_string())?;
    let img = image::load_from_memory(&bytes).map_err(|e| e.to_string())?;
    let cropped =
        image::imageops::crop_imm(&img.into_rgba8(), x as u32, y as u32, width, height).to_image();
    let (cw, ch) = (cropped.width(), cropped.height());

    let mut out: Vec<u8> = Vec::new();
    cropped
        .write_to(
            &mut std::io::Cursor::new(&mut out),
            image::ImageFormat::Png,
        )
        .map_err(|e| e.to_string())?;

    let data_url = format!("data:image/png;base64,{}", STANDARD.encode(&out));
    let tmp = std::env::temp_dir().join(format!("sakongly_cap_wayland_{}.png", ch));
    std::fs::write(&tmp, &out).map_err(|e| e.to_string())?;

    Ok(CaptureResult {
        data_url,
        width: cw,
        height: ch,
        temp_path: tmp.to_string_lossy().into_owned(),
    })
}
