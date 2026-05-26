import { useEffect } from "react";
import { useUi } from "@/stores/ui";
import { useConversation } from "@/stores/conversation";
import { ipc } from "@/lib/ipc";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { InputBar } from "./InputBar";
import { ChatPanel } from "./ChatPanel";
import { AttachmentTray } from "./AttachmentTray";
import { QuickActions } from "./QuickActions";
import { ErrorBanner } from "./ErrorBanner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Overlay() {
  useGlobalShortcuts();

  const expanded = useUi((s) => s.overlayExpanded);
  const { setOverlayExpanded } = useUi();
  const isStreaming = useConversation((s) => s.isStreaming);
  const lastError = useConversation((s) => s.lastError);
  const { retry } = useStreamingChat();

  // Sync window height with UI state
  useEffect(() => {
    if (expanded) {
      ipc.expandOverlay(520).catch(console.error);
      ipc.setIgnoreCursor(false).catch(console.error);
    } else {
      ipc.collapseOverlay().catch(console.error);
      if (!isStreaming) {
        ipc.setIgnoreCursor(false).catch(console.error);
      }
    }
  }, [expanded, isStreaming]);

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={cn(
          "relative w-full flex flex-col overflow-hidden",
          "rounded-xl border border-border shadow-2xl",
          "bg-background/95 backdrop-blur-xl",
          "ring-1 ring-primary/20",
          "transition-all duration-200 ease-in-out"
        )}
        style={{ height: expanded ? 520 : 54 }}
        onMouseEnter={() => ipc.setIgnoreCursor(false).catch(() => {})}
      >
        {/* Accent strip — makes the overlay visible at a glance */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary/60 pointer-events-none" />

        {/* Top bar - always visible */}
        <InputBar
          onExpand={() => setOverlayExpanded(true)}
          onCollapse={() => setOverlayExpanded(false)}
          expanded={expanded}
        />

        {/* Expanded content */}
        {expanded && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <AttachmentTray />
            {lastError && <ErrorBanner message={lastError} onRetry={retry} />}
            <ChatPanel />
            <QuickActions />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
