import { useState } from "react";
import { Trash2, Search } from "lucide-react";
import { useConversations, useDeleteConversation } from "@/hooks/useConversations";
import { useConversation } from "@/stores/conversation";
import { dateGroupLabel } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/types";

export function Sidebar() {
  const [search, setSearch] = useState("");
  const { data: conversations = [] } = useConversations(search || undefined);
  const { mutate: deleteConv } = useDeleteConversation();
  const { activeConversation, setActiveConversation, setMessages } = useConversation();

  async function openConversation(conv: Conversation) {
    setActiveConversation(conv);
    // Messages will be loaded by ConversationView via useMessages
    setMessages([]);
  }

  // Group by date label
  const grouped = conversations.reduce<Record<string, Conversation[]>>((acc, c) => {
    const label = dateGroupLabel(c.updated_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(c);
    return acc;
  }, {});

  return (
    <div className="w-64 flex flex-col border-r border-border shrink-0">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {Object.entries(grouped).map(([label, convs]) => (
            <div key={label} className="mb-4">
              <p className="text-[10px] font-medium uppercase text-muted-foreground px-1 mb-1">
                {label}
              </p>
              {convs.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between rounded px-2 py-1.5 cursor-pointer ${
                    activeConversation?.id === conv.id
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => openConversation(conv)}
                >
                  <span className="text-xs truncate flex-1 text-foreground">
                    {conv.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConv(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <Button
          variant="outline"
          className="w-full text-xs h-7"
          onClick={() => {
            setActiveConversation(null);
            setMessages([]);
          }}
        >
          New conversation
        </Button>
      </div>
    </div>
  );
}
