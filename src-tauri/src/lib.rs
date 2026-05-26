mod ai;
mod commands;
mod screenshot;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(
                    "sqlite:sakongly.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "init",
                        sql: include_str!("../migrations/001_init.sql"),
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            commands::window::toggle_overlay,
            commands::window::expand_overlay,
            commands::window::collapse_overlay,
            commands::window::move_overlay_by,
            commands::window::open_dashboard,
            commands::window::set_ignore_cursor,
            commands::window::set_skip_taskbar,
            commands::window::get_primary_monitor_info,
            commands::screenshot::capture_fullscreen,
            commands::screenshot::start_region_capture,
            commands::provider::validate_curl_template,
            commands::provider::ai_stream,
            commands::provider::ai_cancel,
            commands::files::attach_file,
            commands::machine::machine_uid,
        ])
        .setup(|app| {
            // Position overlay window at top-center on startup
            if let Some(win) = app.get_webview_window("main") {
                if let Some(monitor) = win.primary_monitor()? {
                    let size = monitor.size();
                    let x = ((size.width as i32) - 600) / 2;
                    win.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                        x,
                        y: 54,
                    }))?;
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running sakongly");
}
