use xcap::Monitor;

#[derive(Debug, Clone, serde::Serialize)]
pub struct MonitorScale {
    pub index: usize,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f32,
}

pub fn list_monitors() -> Vec<MonitorScale> {
    Monitor::all()
        .unwrap_or_default()
        .into_iter()
        .enumerate()
        .map(|(i, m)| MonitorScale {
            index: i,
            x: m.x(),
            y: m.y(),
            width: m.width(),
            height: m.height(),
            scale_factor: m.scale_factor(),
        })
        .collect()
}
