import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationDb, messageDb } from "@/lib/db";
import { useConversation } from "@/stores/conversation";

export function useConversations(search?: string) {
  return useQuery({
    queryKey: ["conversations", search],
    queryFn: () =>
      search ? conversationDb.search(search) : conversationDb.list(),
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => (conversationId ? messageDb.list(conversationId) : []),
    enabled: !!conversationId,
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  const { activeConversation, setActiveConversation } = useConversation();

  return useMutation({
    mutationFn: (id: string) => conversationDb.delete(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (activeConversation?.id === id) {
        setActiveConversation(null);
      }
    },
  });
}
