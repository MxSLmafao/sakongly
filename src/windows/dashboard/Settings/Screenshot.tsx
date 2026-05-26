import { useConfig } from "@/stores/config";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function ScreenshotSettings() {
  const { screenshot, setScreenshot } = useConfig();

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex flex-col gap-1.5">
        <Label>Capture delay (ms)</Label>
        <Input
          type="number"
          min={0}
          max={5000}
          step={100}
          value={screenshot.delay_ms}
          onChange={(e) => setScreenshot({ delay_ms: Number(e.target.value) })}
          className="w-32"
        />
        <p className="text-xs text-muted-foreground">Delay before capturing. Useful when you need to arrange windows first.</p>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <Label>Auto-submit after capture</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immediately send the screenshot to the active provider with the prompt below.
          </p>
        </div>
        <Switch
          checked={screenshot.auto_submit}
          onCheckedChange={(v) => setScreenshot({ auto_submit: v })}
        />
      </div>

      {screenshot.auto_submit && (
        <div className="flex flex-col gap-1.5">
          <Label>Auto-submit prompt</Label>
          <Textarea
            value={screenshot.auto_submit_prompt}
            onChange={(e) => setScreenshot({ auto_submit_prompt: e.target.value })}
            className="min-h-[80px]"
          />
        </div>
      )}
    </div>
  );
}
