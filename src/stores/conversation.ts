import { create } from "zustand";
import type { Conversation, Message, Attachment } from "@/lib/types";

interface ConversationState {
  activeConversation: Conversation | null;
  messages: Message[];
  streamingMessageId: string | null;
  streamingContent: string;
  attachments: Attachment[];
  pendingRequestId: string | null;
  isStreaming: boolean;
  lastError: string | null;

  setActiveConversation: (c: Conversation | null) => void;
  setMessages: (msgs: Message[]) => void;
  appendMessage: (msg: Message) => void;
  updateStreamingChunk: (text: string) => void;
  setStreamingMessageId: (id: string | null) => void;
  finalizeStreaming: () => void;
  addAttachment: (a: Attachment) => void;
  removeAttachment: (path: string) => void;
  clearAttachments: () => void;
  setPendingRequestId: (id: string | null) => void;
  setIsStreaming: (v: boolean) => void;
  setLastError: (err: string | null) => void;
  removeMessage: (id: string) => void;
}

export const useConversation = create<ConversationState>()((set) => ({
  activeConversation: null,
  messages: [],
  streamingMessageId: null,
  streamingContent: "",
  attachments: [],
  pendingRequestId: null,
  isStreaming: false,
  lastError: null,

  setActiveConversation: (c) => set({ activeConversation: c, messages: [] }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateStreamingChunk: (text) =>
    set((s) => ({ streamingContent: s.streamingContent + text })),
  setStreamingMessageId: (id) => set({ streamingMessageId: id, streamingContent: "" }),
  finalizeStreaming: () =>
    set((s) => {
      if (!s.streamingMessageId) return {};
      const updated = s.messages.map((m) =>
        m.id === s.streamingMessageId
          ? { ...m, content: s.streamingContent || m.content }
          : m
      );
      return {
        messages: updated,
        streamingMessageId: null,
        streamingContent: "",
        isStreaming: false,
      };
    }),
  addAttachment: (a) =>
    set((s) => ({ attachments: [...s.attachments, a] })),
  removeAttachment: (path) =>
    set((s) => ({ attachments: s.attachments.filter((a) => a.path !== path) })),
  clearAttachments: () => set({ attachments: [] }),
  setPendingRequestId: (id) => set({ pendingRequestId: id }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setLastError: (lastError) => set({ lastError }),
  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
}));
