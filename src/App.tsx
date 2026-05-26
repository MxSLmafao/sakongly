import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ErrorBoundary } from "./ErrorBoundary";
import { Overlay } from "./windows/overlay/Overlay";
import { Dashboard } from "./windows/dashboard/Dashboard";
import { useTheme } from "./hooks/useTheme";
import { useConfig } from "./stores/config";
import { ipc } from "./lib/ipc";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AppContent() {
  const [windowLabel, setWindowLabel] = useState<string>("main");
  const hasCompletedSetup = useConfig((s) => s.hasCompletedSetup);
  const didOpenDashboard = useRef(false);
  useTheme();

  useEffect(() => {
    const win = getCurrentWebviewWindow();
    setWindowLabel(win.label);
  }, []);

  // First-run: open dashboard so the user can configure a provider.
  useEffect(() => {
    if (windowLabel === "main" && !hasCompletedSetup && !didOpenDashboard.current) {
      didOpenDashboard.current = true;
      ipc.openDashboard().catch(() => {});
    }
  }, [windowLabel, hasCompletedSetup]);

  if (windowLabel === "dashboard") {
    return <Dashboard />;
  }
  return <Overlay />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
