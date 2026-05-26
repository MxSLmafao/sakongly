import { useConfig } from "@/stores/config";
import { useStreamingChat } from "@/hooks/useStreamingChat";

export function QuickActions() {
  const quickActions = useConfig((s) => s.quickActions);
  const { submit } = useStreamingChat();

  if (quickActions.length === 0) return null;

  return (
    <div className="flex gap-1.5 px-3 py-1.5 border-t border-border/30 overflow-x-auto shrink-0">
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => submit(action.prompt)}
          className="shrink-0 rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors whitespace-nowrap"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
