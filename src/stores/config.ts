import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Provider } from "@/lib/providers/types";
import { PROVIDER_PRESETS } from "@/lib/providers/presets";
import { DEFAULT_SHORTCUTS, type ShortcutAction } from "@/lib/shortcuts";
import { ulid } from "ulid";

export type Theme = "light" | "dark" | "system";

export interface ScreenshotConfig {
  delay_ms: number;
  auto_submit: boolean;
  auto_submit_prompt: string;
}

export interface ResponsePrefs {
  language: string;
  max_length: "short" | "medium" | "long";
}

interface ConfigState {
  theme: Theme;
  transparency: number; // 0.0 – 1.0, applies to overlay bg
  shortcuts: Record<ShortcutAction, string>;
  selectedProviderId: string | null;
  providers: Provider[];
  screenshot: ScreenshotConfig;
  quickActions: { id: string; label: string; prompt: string }[];
  responsePrefs: ResponsePrefs;
  posthogOptIn: boolean;

  setTheme: (t: Theme) => void;
  setTransparency: (v: number) => void;
  setShortcut: (action: ShortcutAction, accelerator: string) => void;
  selectProvider: (id: string | null) => void;
  addProvider: (p: Omit<Provider, "id">) => Provider;
  updateProvider: (id: string, p: Partial<Provider>) => void;
  removeProvider: (id: string) => void;
  setScreenshot: (s: Partial<ScreenshotConfig>) => void;
  addQuickAction: (label: string, prompt: string) => void;
  removeQuickAction: (id: string) => void;
  setResponsePrefs: (r: Partial<ResponsePrefs>) => void;
  setPosthogOptIn: (v: boolean) => void;
}

const defaultProviders: Provider[] = PROVIDER_PRESETS.map((p) => ({
  ...p,
  id: ulid(),
  api_key: "",
}));

export const useConfig = create<ConfigState>()(
  persist(
    (set) => ({
      theme: "system",
      transparency: 0.9,
      shortcuts: { ...DEFAULT_SHORTCUTS },
      selectedProviderId: defaultProviders[0]?.id ?? null,
      providers: defaultProviders,
      screenshot: {
        delay_ms: 0,
        auto_submit: false,
        auto_submit_prompt: "Describe what you see in this screenshot.",
      },
      quickActions: [],
      responsePrefs: { language: "English", max_length: "medium" },
      posthogOptIn: false,

      setTheme: (theme) => set({ theme }),
      setTransparency: (transparency) => set({ transparency }),
      setShortcut: (action, accelerator) =>
        set((s) => ({ shortcuts: { ...s.shortcuts, [action]: accelerator } })),
      selectProvider: (id) => set({ selectedProviderId: id }),
      addProvider: (p) => {
        const provider: Provider = { ...p, id: ulid() };
        set((s) => ({ providers: [...s.providers, provider] }));
        return provider;
      },
      updateProvider: (id, p) =>
        set((s) => ({
          providers: s.providers.map((pr) => (pr.id === id ? { ...pr, ...p } : pr)),
        })),
      removeProvider: (id) =>
        set((s) => ({
          providers: s.providers.filter((p) => p.id !== id),
          selectedProviderId: s.selectedProviderId === id ? null : s.selectedProviderId,
        })),
      setScreenshot: (s) =>
        set((state) => ({ screenshot: { ...state.screenshot, ...s } })),
      addQuickAction: (label, prompt) =>
        set((s) => ({
          quickActions: [...s.quickActions, { id: ulid(), label, prompt }],
        })),
      removeQuickAction: (id) =>
        set((s) => ({ quickActions: s.quickActions.filter((a) => a.id !== id) })),
      setResponsePrefs: (r) =>
        set((s) => ({ responsePrefs: { ...s.responsePrefs, ...r } })),
      setPosthogOptIn: (posthogOptIn) => set({ posthogOptIn }),
    }),
    {
      name: "sakongly.config",
    }
  )
);
