import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { ipc } from "./ipc";

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}

type StreamEvent =
  | { type: "chunk"; data: string }
  | { type: "done" }
  | { type: "error"; data: string };

export async function startStream(
  requestId: string,
  callbacks: StreamCallbacks
): Promise<UnlistenFn> {
  const eventName = `stream://${requestId}`;
  const unlisten = await listen<StreamEvent>(eventName, (event) => {
    const payload = event.payload;
    if (payload.type === "chunk") {
      callbacks.onChunk(payload.data);
    } else if (payload.type === "done") {
      callbacks.onDone();
    } else if (payload.type === "error") {
      callbacks.onError(payload.data);
    }
  });
  return unlisten;
}

export async function cancelStream(requestId: string): Promise<void> {
  await ipc.aiCancel(requestId);
}
