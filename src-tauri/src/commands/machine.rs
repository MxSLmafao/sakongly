use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

#[tauri::command]
pub fn machine_uid() -> String {
    // Stable identifier derived from hostname + OS info.
    // Not cryptographically unique — used for soft instance binding only.
    let hostname = std::env::var("HOSTNAME")
        .or_else(|_| {
            std::fs::read_to_string("/etc/hostname").map(|s| s.trim().to_string())
        })
        .unwrap_or_else(|_| "unknown".to_string());

    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let raw = format!("{hostname}-{os}-{arch}");

    let mut hasher = DefaultHasher::new();
    raw.hash(&mut hasher);
    format!("uid-{:x}", hasher.finish())
}
