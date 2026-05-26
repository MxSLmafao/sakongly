import { useEffect } from "react";
import { useConfig } from "@/stores/config";
import { registerShortcuts, unregisterShortcuts } from "@/lib/shortcuts";
import { ipc } from "@/lib/ipc";
import { useUi } from "@/stores/ui";

export function useGlobalShortcuts() {
  const shortcuts = useConfig((s) => s.shortcuts);
  const { setOverlayExpanded } = useUi();

  useEffect(() => {
    const handlers = {
      toggle_overlay: async () => {
        const visible = await ipc.toggleOverlay();
        if (!visible) setOverlayExpanded(false);
      },
      focus_input: async () => {
        await ipc.toggleOverlay();
        document.querySelector<HTMLTextAreaElement>("[data-input]")?.focus();
      },
      open_dashboard: () => ipc.openDashboard(),
      screenshot_region: () => {
        useUi.getState().setScreenshotSelecting(true);
      },
      screenshot_fullscreen: async () => {
        try {
          const result = await ipc.captureFullscreen(0);
          // Dispatch to conversation store as attachment
          const { addAttachment } = (await import("@/stores/conversation")).useConversation.getState();
          addAttachment({
            path: result.temp_path,
            name: "screenshot.png",
            mime: "image/png",
            size: 0,
            data_url: result.data_url,
          });
        } catch (err) {
          console.error("Screenshot failed:", err);
        }
      },
      move_up: () => ipc.moveOverlayBy(0, -10),
      move_down: () => ipc.moveOverlayBy(0, 10),
      move_left: () => ipc.moveOverlayBy(-10, 0),
      move_right: () => ipc.moveOverlayBy(10, 0),
    };

    registerShortcuts(shortcuts, handlers);
    return () => {
      unregisterShortcuts();
    };
  }, [shortcuts, setOverlayExpanded]);
}
