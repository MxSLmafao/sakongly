import { useState } from "react";
import { useConfig } from "@/stores/config";
import { type ShortcutAction } from "@/lib/shortcuts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ACTION_LABELS: Record<ShortcutAction, string> = {
  toggle_overlay: "Toggle overlay",
  focus_input: "Focus input",
  open_dashboard: "Open dashboard",
  screenshot_region: "Screenshot region",
  screenshot_fullscreen: "Screenshot fullscreen",
  move_up: "Move overlay up",
  move_down: "Move overlay down",
  move_left: "Move overlay left",
  move_right: "Move overlay right",
};

export function ShortcutsSettings() {
  const { shortcuts, setShortcut } = useConfig();
  const [capturing, setCapturing] = useState<ShortcutAction | null>(null);
  const [pending, setPending] = useState<string>("");

  function startCapture(action: ShortcutAction) {
    setCapturing(action);
    setPending("");
  }

  function handleKeyDown(e: React.KeyboardEvent, _action: ShortcutAction) {
    e.preventDefault();
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    if (e.metaKey) parts.push("Meta");
    const key = e.key;
    if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
      const keyName = key === " " ? "Space" : key.length === 1 ? key.toUpperCase() : key;
      parts.push(keyName);
      const accel = parts.join("+");
      setPending(accel);
    }
  }

  function save(action: ShortcutAction) {
    if (pending) {
      setShortcut(action, pending);
    }
    setCapturing(null);
    setPending("");
  }

  return (
    <div className="space-y-4 max-w-md">
      <p className="text-xs text-muted-foreground">
        Click a binding to capture a new shortcut, then press your desired key combination.
      </p>
      {(Object.entries(ACTION_LABELS) as [ShortcutAction, string][]).map(([action, label]) => (
        <div key={action} className="flex items-center justify-between gap-4">
          <Label>{label}</Label>
          {capturing === action ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                readOnly
                value={pending || "Press keys…"}
                onKeyDown={(e) => handleKeyDown(e, action)}
                className="w-40 font-mono text-xs text-center"
              />
              <Button size="sm" onClick={() => save(action)} disabled={!pending}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCapturing(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => startCapture(action)}
              className="px-3 py-1 rounded border border-border font-mono text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-colors min-w-[140px] text-center"
            >
              {shortcuts[action] || "—"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
