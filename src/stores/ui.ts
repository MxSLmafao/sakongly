import { create } from "zustand";

interface UiState {
  overlayExpanded: boolean;
  overlayHeight: number;
  dashboardOpen: boolean;
  screenshotSelecting: boolean;
  settingsTab: string;

  setOverlayExpanded: (v: boolean, height?: number) => void;
  setDashboardOpen: (v: boolean) => void;
  setScreenshotSelecting: (v: boolean) => void;
  setSettingsTab: (tab: string) => void;
}

export const useUi = create<UiState>()((set) => ({
  overlayExpanded: false,
  overlayHeight: 54,
  dashboardOpen: false,
  screenshotSelecting: false,
  settingsTab: "appearance",

  setOverlayExpanded: (v, height = 520) =>
    set({ overlayExpanded: v, overlayHeight: v ? height : 54 }),
  setDashboardOpen: (dashboardOpen) => set({ dashboardOpen }),
  setScreenshotSelecting: (screenshotSelecting) => set({ screenshotSelecting }),
  setSettingsTab: (settingsTab) => set({ settingsTab }),
}));
