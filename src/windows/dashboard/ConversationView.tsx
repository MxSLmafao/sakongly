import { useEffect } from "react";
import { Download, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown/Markdown";
import { useConversation } from "@/stores/conversation";
import { useMessages } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

export function ConversationView() {
  const activeConversation = useConversation((s) => s.activeConversation);
  const storeMessages = useConversation((s) => s.messages);
  const { setMessages } = useConversation();

  const { data: dbMessages, refetch } = useMessages(activeConversation?.id ?? null);

  useEffect(() => {
    if (dbMessages) setMessages(dbMessages);
  }, [dbMessages, setMessages]);

  const messages = storeMessages.length > 0 ? storeMessages : (dbMessages ?? []);

  function exportMarkdown() {
    if (!activeConversation) return;
    const lines: string[] = [`# ${activeConversation.title}\n`];
    messages.forEach((m) => {
      const role = m.role === "user" ? "**You**" : "**Assistant**";
      lines.push(`${role}\n\n${m.content}\n`);
    });
    const blob = new Blob([lines.join("\n---\n\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeConversation.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Select a conversation or start a new one from the overlay
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <h2 className="font-medium text-sm truncate">{activeConversation.title}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exportMarkdown}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.role === "assistant" ? (
                  <Markdown content={msg.content} />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-12">
              No messages in this conversation yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
