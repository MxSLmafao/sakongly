import {
  register,
  unregisterAll,
} from "@tauri-apps/plugin-global-shortcut";

export type ShortcutAction =
  | "toggle_overlay"
  | "focus_input"
  | "open_dashboard"
  | "screenshot_region"
  | "screenshot_fullscreen"
  | "move_up"
  | "move_down"
  | "move_left"
  | "move_right";

export const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = {
  toggle_overlay: "Ctrl+Shift+Space",
  focus_input: "Ctrl+Shift+K",
  open_dashboard: "Ctrl+Shift+D",
  screenshot_region: "Ctrl+Shift+S",
  screenshot_fullscreen: "Ctrl+Shift+F",
  move_up: "Ctrl+Up",
  move_down: "Ctrl+Down",
  move_left: "Ctrl+Left",
  move_right: "Ctrl+Right",
};

type Handler = () => void;

const _handlers = new Map<string, Handler>();

export async function registerShortcuts(
  bindings: Record<ShortcutAction, string>,
  handlers: Record<ShortcutAction, Handler>
) {
  await unregisterAll();
  _handlers.clear();

  for (const [action, accelerator] of Object.entries(bindings) as [ShortcutAction, string][]) {
    const handler = handlers[action];
    if (!accelerator || !handler) continue;
    try {
      await register(accelerator, handler);
      _handlers.set(accelerator, handler);
    } catch (err) {
      console.warn(`Failed to register shortcut ${accelerator}:`, err);
    }
  }
}

export async function unregisterShortcuts() {
  await unregisterAll();
  _handlers.clear();
}
