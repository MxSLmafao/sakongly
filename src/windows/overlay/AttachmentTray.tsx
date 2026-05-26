import { X } from "lucide-react";
import { useConversation } from "@/stores/conversation";
import { formatBytes } from "@/lib/utils";

export function AttachmentTray() {
  const attachments = useConversation((s) => s.attachments);
  const { removeAttachment } = useConversation();

  if (attachments.length === 0) return null;

  return (
    <div className="flex gap-1.5 px-3 py-1.5 flex-wrap border-b border-border/30 shrink-0">
      {attachments.map((att) => (
        <div
          key={att.path}
          className="flex items-center gap-1 bg-muted rounded px-2 py-0.5 text-xs max-w-[140px]"
        >
          {att.data_url && att.mime.startsWith("image/") ? (
            <img
              src={att.data_url}
              alt={att.name}
              className="w-4 h-4 rounded object-cover shrink-0"
            />
          ) : (
            <span className="text-muted-foreground shrink-0">📎</span>
          )}
          <span className="truncate text-foreground">{att.name}</span>
          <span className="text-muted-foreground shrink-0">({formatBytes(att.size)})</span>
          <button
            onClick={() => removeAttachment(att.path)}
            className="ml-0.5 text-muted-foreground hover:text-foreground shrink-0"
            aria-label={`Remove ${att.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
