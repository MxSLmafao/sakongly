import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/markdown/Markdown";
import { useConversation } from "@/stores/conversation";
import { useMessages } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const activeConversation = useConversation((s) => s.activeConversation);
  const storeMessages = useConversation((s) => s.messages);
  const streamingMessageId = useConversation((s) => s.streamingMessageId);
  const streamingContent = useConversation((s) => s.streamingContent);
  const isStreaming = useConversation((s) => s.isStreaming);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: dbMessages } = useMessages(activeConversation?.id ?? null);

  // Hydrate store from DB when conversation changes
  const { setMessages } = useConversation();
  useEffect(() => {
    if (dbMessages) {
      setMessages(dbMessages);
    }
  }, [dbMessages, setMessages]);

  // Auto-scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [storeMessages.length, streamingContent]);

  const messages = storeMessages.length > 0 ? storeMessages : (dbMessages ?? []);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Start a conversation
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-3 py-2">
      <div className="flex flex-col gap-3">
        {messages.map((msg) => {
          const content =
            msg.id === streamingMessageId ? streamingContent || "…" : msg.content;

          return (
            <div
              key={msg.id}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.role === "assistant" ? (
                  <Markdown content={content} />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{content}</p>
                )}
              </div>
            </div>
          );
        })}

        {isStreaming && !streamingMessageId && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
              <span className="animate-pulse">●●●</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
