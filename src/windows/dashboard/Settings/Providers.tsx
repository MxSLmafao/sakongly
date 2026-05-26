import { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle, Copy } from "lucide-react";
import { useConfig } from "@/stores/config";
import { ipc } from "@/lib/ipc";
import { PROVIDER_PRESETS } from "@/lib/providers/presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { captureProviderConfigured } from "@/lib/posthog";
import type { Provider } from "@/lib/providers/types";

export function ProvidersSettings() {
  const { providers, selectedProviderId, selectProvider, addProvider, updateProvider, removeProvider, setHasCompletedSetup } = useConfig();
  const [editing, setEditing] = useState<Provider | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; error?: string; method?: string; url?: string } | null>(null);

  function editProvider(p: Provider) {
    setEditing({ ...p });
    setValidation(null);
  }

  async function validateCurl() {
    if (!editing) return;
    const result = await ipc.validateCurlTemplate(editing.curl_template);
    setValidation(result);
  }

  function saveEditing() {
    if (!editing) return;
    updateProvider(editing.id, editing);
    setHasCompletedSetup(true);
    setEditing(null);
    captureProviderConfigured(editing.name);
  }

  function addFromPreset(preset: typeof PROVIDER_PRESETS[0]) {
    const p = addProvider({ ...preset, api_key: "" });
    editProvider(p);
  }

  function addBlank() {
    const p = addProvider({
      name: "Custom provider",
      curl_template: `curl -s -N https://api.example.com/v1/chat/completions \\\n  -H "Authorization: Bearer {{API_KEY}}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"{{MODEL}}","messages":[{"role":"user","content":"{{TEXT}}"}],"stream":true}'`,
      response_path: "choices[0].delta.content",
      streaming: true,
      model: "gpt-4o",
      system_prompt: "You are a helpful assistant.",
      is_preset: false,
      api_key: "",
    });
    editProvider(p);
  }

  function field<K extends keyof Provider>(key: K, value: Provider[K]) {
    setEditing((e) => e ? { ...e, [key]: value } : e);
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left: list */}
      <div className="w-64 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Providers</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addBlank}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {providers.map((p) => (
          <div
            key={p.id}
            onClick={() => editProvider(p)}
            className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
              editing?.id === p.id ? "bg-accent" : "hover:bg-accent/50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedProviderId === p.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
              <span className="text-sm truncate">{p.name}</span>
              {p.is_preset && (
                <span className="text-[10px] bg-muted text-muted-foreground rounded px-1 shrink-0">preset</span>
              )}
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  selectProvider(p.id);
                }}
                title="Set active"
              >
                <CheckCircle className="h-3 w-3 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  removeProvider(p.id);
                  if (editing?.id === p.id) setEditing(null);
                }}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}

        <Separator />
        <p className="text-[10px] text-muted-foreground px-1">Add from preset</p>
        {PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => addFromPreset(preset)}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 text-left"
          >
            <Copy className="h-3 w-3 shrink-0" />
            {preset.name}
          </button>
        ))}
      </div>

      <Separator orientation="vertical" />

      {/* Right: editor */}
      {editing ? (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Edit provider</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={validateCurl}>
                Validate
              </Button>
              <Button size="sm" onClick={saveEditing}>
                Save
              </Button>
            </div>
          </div>

          {validation && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded ${validation.valid ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"}`}>
              {validation.valid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {validation.valid ? `Valid — ${validation.method} ${validation.url}` : validation.error}
            </div>
          )}

          <Field label="Name">
            <Input value={editing.name} onChange={(e) => field("name", e.target.value)} />
          </Field>

          <Field label="API Key">
            <Input
              type="password"
              value={editing.api_key}
              onChange={(e) => field("api_key", e.target.value)}
              placeholder="Leave empty for local providers"
            />
          </Field>

          <Field label="Model">
            <Input value={editing.model} onChange={(e) => field("model", e.target.value)} />
          </Field>

          <Field label="curl template" description="Use {{API_KEY}}, {{TEXT}}, {{IMAGE}}, {{SYSTEM_PROMPT}}, {{MODEL}}">
            <Textarea
              value={editing.curl_template}
              onChange={(e) => field("curl_template", e.target.value)}
              className="font-mono text-xs min-h-[120px]"
            />
          </Field>

          <Field label="Response JSON path" description='e.g. choices[0].delta.content or message.content'>
            <Input
              value={editing.response_path}
              onChange={(e) => field("response_path", e.target.value)}
              className="font-mono"
            />
          </Field>

          <Field label="System prompt">
            <Textarea
              value={editing.system_prompt}
              onChange={(e) => field("system_prompt", e.target.value)}
              className="min-h-[80px]"
            />
          </Field>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="streaming"
              checked={editing.streaming}
              onChange={(e) => field("streaming", e.target.checked)}
            />
            <Label htmlFor="streaming">Enable streaming</Label>
          </div>

          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectProvider(editing.id)}
              className={selectedProviderId === editing.id ? "border-primary text-primary" : ""}
            >
              {selectedProviderId === editing.id ? "✓ Active provider" : "Set as active provider"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a provider to edit it
        </div>
      )}
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
