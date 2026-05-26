import { useCallback, useRef } from "react";
import { ulid } from "ulid";
import { ipc } from "@/lib/ipc";
import { startStream, cancelStream } from "@/lib/streaming";
import { useConfig } from "@/stores/config";
import { useConversation } from "@/stores/conversation";
import { conversationDb, messageDb } from "@/lib/db";
import type { Attachment } from "@/lib/types";

export function useStreamingChat() {
  const providers = useConfig((s) => s.providers);
  const selectedProviderId = useConfig((s) => s.selectedProviderId);
  const responsePrefs = useConfig((s) => s.responsePrefs);
  const {
    activeConversation,
    setActiveConversation,
    appendMessage,
    updateStreamingChunk,
    setStreamingMessageId,
    finalizeStreaming,
    setPendingRequestId,
    setIsStreaming,
    setLastError,
    removeMessage,
    isStreaming,
  } = useConversation();

  const unlistenRef = useRef<(() => void) | null>(null);
  const assistantMsgIdRef = useRef<string | null>(null);
  const lastSubmitRef = useRef<{ text: string; attachments: Attachment[] } | null>(null);
  // Stable ref so retry can call submit without a circular dependency.
  const submitRef = useRef<(text: string, attachments?: Attachment[]) => Promise<void>>(
    async () => {}
  );

  const cancel = useCallback(async () => {
    if (useConversation.getState().pendingRequestId) {
      await cancelStream(useConversation.getState().pendingRequestId!);
    }
    unlistenRef.current?.();
    finalizeStreaming();
    setPendingRequestId(null);
  }, [finalizeStreaming, setPendingRequestId]);

  const retry = useCallback(async () => {
    if (!lastSubmitRef.current) return;
    setLastError(null);
    await submitRef.current(lastSubmitRef.current.text, lastSubmitRef.current.attachments);
  }, [setLastError]);

  const submit = useCallback(
    async (text: string, attachments: Attachment[] = []) => {
      if (isStreaming) await cancel();
      lastSubmitRef.current = { text, attachments };
      setLastError(null);

      const provider = providers.find((p) => p.id === selectedProviderId);
      if (!provider) throw new Error("No provider selected");

      // Ensure we have an active conversation
      let conv = activeConversation;
      if (!conv) {
        const title = text.slice(0, 60) || "New conversation";
        conv = await conversationDb.create(title, provider.id);
        setActiveConversation(conv);
      }

      // Save user message
      const attachmentsJson =
        attachments.length > 0 ? JSON.stringify(attachments) : undefined;
      const userMsg = await messageDb.create(conv.id, "user", text, attachmentsJson);
      appendMessage(userMsg);

      // Create a placeholder assistant message
      const assistantId = ulid();
      assistantMsgIdRef.current = assistantId;
      const assistantMsg = await messageDb.create(conv.id, "assistant", "");
      // We'll update DB once streaming completes; use the real DB id
      const realAssistantId = assistantMsg.id;
      appendMessage({ ...assistantMsg });
      setStreamingMessageId(realAssistantId);
      setIsStreaming(true);

      const requestId = ulid();
      setPendingRequestId(requestId);

      // First image attachment (if any)
      const imageAttachment = attachments.find((a) => a.mime.startsWith("image/"));

      const unlisten = await startStream(requestId, {
        onChunk: (chunk) => updateStreamingChunk(chunk),
        onDone: async () => {
          const finalContent = useConversation.getState().streamingContent;
          finalizeStreaming();
          await messageDb.updateContent(realAssistantId, finalContent);
          setPendingRequestId(null);
          unlistenRef.current?.();
        },
        onError: async (msg) => {
          finalizeStreaming();
          removeMessage(realAssistantId);
          await messageDb.delete(realAssistantId).catch(() => {});
          setLastError(msg);
          setPendingRequestId(null);
          unlistenRef.current?.();
        },
      });
      unlistenRef.current = unlisten;

      const systemPromptWithPrefs = `${provider.system_prompt}\n\nRespond in ${responsePrefs.language}. Keep responses ${responsePrefs.max_length}.`;

      try {
        await ipc.aiStream({
          request_id: requestId,
          curl_template: provider.curl_template,
          api_key: provider.api_key,
          model: provider.model,
          system_prompt: systemPromptWithPrefs,
          text,
          image_data_url: imageAttachment?.data_url ?? undefined,
          response_path: provider.response_path,
          streaming: provider.streaming,
        });
      } catch (e) {
        // Rust command itself failed (e.g. template parse error before any emit).
        const msg = e instanceof Error ? e.message : String(e);
        finalizeStreaming();
        removeMessage(realAssistantId);
        await messageDb.delete(realAssistantId).catch(() => {});
        setLastError(msg);
        setPendingRequestId(null);
        unlistenRef.current?.();
      }
    },
    [
      isStreaming,
      cancel,
      providers,
      selectedProviderId,
      activeConversation,
      setActiveConversation,
      appendMessage,
      updateStreamingChunk,
      setStreamingMessageId,
      finalizeStreaming,
      setPendingRequestId,
      setIsStreaming,
      setLastError,
      removeMessage,
      responsePrefs,
    ]
  );

  submitRef.current = submit;

  return { submit, cancel, retry, isStreaming };
}
