import { useConfig, type Theme } from "@/stores/config";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useEffect, useState } from "react";
import { ipc } from "@/lib/ipc";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function AppearanceSettings() {
  const { theme, setTheme, transparency, setTransparency, posthogOptIn, setPosthogOptIn } =
    useConfig();
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [skipTaskbar, setSkipTaskbar] = useState(true);

  useEffect(() => {
    isEnabled().then(setAutostartEnabled).catch(() => {});
  }, []);

  async function toggleAutostart(v: boolean) {
    if (v) await enable();
    else await disable();
    setAutostartEnabled(v);
  }

  async function toggleSkipTaskbar(v: boolean) {
    await ipc.setSkipTaskbar(v);
    setSkipTaskbar(v);
  }

  return (
    <div className="space-y-6 max-w-md">
      <Section title="Theme">
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                theme === t.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Overlay transparency">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={transparency}
            onChange={(e) => setTransparency(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-10">
            {Math.round(transparency * 100)}%
          </span>
        </div>
      </Section>

      <Section title="System">
        <ToggleRow
          label="Launch at login"
          checked={autostartEnabled}
          onCheckedChange={toggleAutostart}
        />
        <ToggleRow
          label="Hide from taskbar"
          checked={skipTaskbar}
          onCheckedChange={toggleSkipTaskbar}
        />
        <ToggleRow
          label="Send anonymous analytics"
          description="Only app-start and provider-configured events. No conversation content."
          checked={posthogOptIn}
          onCheckedChange={setPosthogOptIn}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
