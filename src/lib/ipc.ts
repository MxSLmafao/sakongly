import { invoke } from "@tauri-apps/api/core";
import type { AttachmentInfo } from "./types";

export const ipc = {
  toggleOverlay: () => invoke<boolean>("toggle_overlay"),
  expandOverlay: (height: number) => invoke<void>("expand_overlay", { height }),
  collapseOverlay: () => invoke<void>("collapse_overlay"),
  moveOverlayBy: (dx: number, dy: number) => invoke<void>("move_overlay_by", { dx, dy }),
  openDashboard: () => invoke<void>("open_dashboard"),
  setIgnoreCursor: (ignore: boolean) => invoke<void>("set_ignore_cursor", { ignore }),
  setSkipTaskbar: (skip: boolean) => invoke<void>("set_skip_taskbar", { skip }),
  getPrimaryMonitor: () =>
    invoke<{ width: number; height: number; x: number; y: number; scale_factor: number }>(
      "get_primary_monitor_info"
    ),
  validateCurlTemplate: (curl: string) =>
    invoke<{ valid: boolean; error?: string; method?: string; url?: string }>(
      "validate_curl_template",
      { curl }
    ),
  aiStream: (req: StreamRequest) => invoke<void>("ai_stream", { req }),
  aiCancel: (requestId: string) => invoke<boolean>("ai_cancel", { requestId }),
  captureFullscreen: (monitorIndex: number) =>
    invoke<CaptureResult>("capture_fullscreen", { monitorIndex }),
  startRegionCapture: (x: number, y: number, width: number, height: number, monitorIndex: number) =>
    invoke<CaptureResult>("start_region_capture", { x, y, width, height, monitorIndex }),
  attachFile: (paths: string[], currentCount: number) =>
    invoke<AttachmentInfo[]>("attach_file", { paths, currentCount }),
  machineUid: () => invoke<string>("machine_uid"),
};

export interface StreamRequest {
  request_id: string;
  curl_template: string;
  api_key: string;
  model: string;
  system_prompt: string;
  text: string;
  image_data_url?: string;
  response_path: string;
  streaming: boolean;
}

export interface CaptureResult {
  data_url: string;
  width: number;
  height: number;
  temp_path: string;
}
