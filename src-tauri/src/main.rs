// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Force XWayland on Linux so we get:
    // - self-positioning (Wayland xdg-toplevel ignores set_position)
    // - transparent + undecorated windows (compositor-dependent on native Wayland)
    // - reliable always-on-top behaviour
    // Must be set before GTK initialises — setting it here, at the top of main(),
    // is the only reliable place to do this from within the binary itself.
    #[cfg(target_os = "linux")]
    {
        // Only override if the user hasn't explicitly set GDK_BACKEND themselves.
        if std::env::var("GDK_BACKEND").is_err() {
            std::env::set_var("GDK_BACKEND", "x11");
        }
        // Disable WebKit GPU compositing to avoid blank-window issues on some
        // Wayland/XWayland compositors.
        if std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").is_err() {
            std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        }
    }

    sakongly_lib::run()
}
