use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindowBuilder};

#[tauri::command]
pub async fn toggle_overlay(app: AppHandle) -> Result<bool, String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window not found")?;
    let visible = win.is_visible().map_err(|e| e.to_string())?;
    if visible {
        win.hide().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
pub async fn expand_overlay(app: AppHandle, height: u32) -> Result<(), String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window not found")?;
    win.set_size(PhysicalSize::new(600u32, height))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn collapse_overlay(app: AppHandle) -> Result<(), String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window not found")?;
    win.set_size(PhysicalSize::new(600u32, 54u32))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_overlay_by(app: AppHandle, dx: i32, dy: i32) -> Result<(), String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window not found")?;
    let pos = win.outer_position().map_err(|e| e.to_string())?;
    win.set_position(PhysicalPosition::new(pos.x + dx, pos.y + dy))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_dashboard(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("dashboard") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        "dashboard",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("Sakongly")
    .inner_size(1200.0, 800.0)
    .min_inner_size(900.0, 600.0)
    .resizable(true)
    .decorations(true)
    .transparent(false)
    .always_on_top(false)
    .skip_taskbar(false)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn set_ignore_cursor(app: AppHandle, ignore: bool) -> Result<(), String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window not found")?;
    win.set_ignore_cursor_events(ignore)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_skip_taskbar(app: AppHandle, skip: bool) -> Result<(), String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window not found")?;
    win.set_skip_taskbar(skip).map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
pub struct MonitorInfo {
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub scale_factor: f64,
}

#[tauri::command]
pub async fn get_primary_monitor_info(app: AppHandle) -> Result<MonitorInfo, String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window not found")?;
    let monitor = win
        .primary_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("no primary monitor")?;
    let size = monitor.size();
    let pos = monitor.position();
    Ok(MonitorInfo {
        width: size.width,
        height: size.height,
        x: pos.x,
        y: pos.y,
        scale_factor: monitor.scale_factor(),
    })
}
