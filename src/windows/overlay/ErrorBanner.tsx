import { X, Settings, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ipc } from "@/lib/ipc";
import { useConversation } from "@/stores/conversation";

interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  const setLastError = useConversation((s) => s.setLastError);

  return (
    <div className="flex items-center gap-2 px-3 py-2 mx-2 mb-1 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
      <span className="flex-1 truncate" title={message}>
        {message}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-destructive hover:bg-destructive/10"
        onClick={() => ipc.openDashboard().catch(() => {})}
        title="Open settings"
      >
        <Settings className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-destructive hover:bg-destructive/10"
        onClick={onRetry}
        title="Retry"
      >
        <RotateCcw className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-destructive hover:bg-destructive/10"
        onClick={() => setLastError(null)}
        title="Dismiss"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
