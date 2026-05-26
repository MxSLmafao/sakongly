import { useRef, useState, type KeyboardEvent } from "react";
import { Send, Paperclip, Camera, X, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { useConversation } from "@/stores/conversation";
import { useConfig } from "@/stores/config";
import { ipc } from "@/lib/ipc";
import { open } from "@tauri-apps/plugin-dialog";

interface Props {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

export function InputBar({ expanded, onExpand, onCollapse }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submit, cancel, isStreaming } = useStreamingChat();
  const attachments = useConversation((s) => s.attachments);
  const { addAttachment } = useConversation();
  const selectedProviderId = useConfig((s) => s.selectedProviderId);
  const providers = useConfig((s) => s.providers);
  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  async function handleSubmit() {
    if (!text.trim() && attachments.length === 0) return;
    const t = text;
    const atts = [...attachments];
    setText("");
    useConversation.getState().clearAttachments();
    await submit(t, atts);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCollapse();
    }
  }

  async function handleAttach() {
    const files = await open({ multiple: true });
    if (!files) return;
    const paths = Array.isArray(files) ? files : [files];
    try {
      const infos = await ipc.attachFile(paths, attachments.length);
      infos.forEach((info) => addAttachment(info));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleScreenshot() {
    try {
      const result = await ipc.captureFullscreen(0);
      addAttachment({
        path: result.temp_path,
        name: "screenshot.png",
        mime: "image/png",
        size: 0,
        data_url: result.data_url,
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex items-center gap-1.5 px-2 h-[54px] shrink-0">
      {/* Drag handle / collapse */}
      <button
        onClick={expanded ? onCollapse : onExpand}
        className="w-1 h-6 rounded-full bg-border/60 hover:bg-border cursor-pointer shrink-0"
        aria-label={expanded ? "Collapse" : "Expand"}
      />

      {/* Provider badge */}
      {selectedProvider && (
        <span className="text-[10px] text-muted-foreground truncate max-w-[64px] shrink-0">
          {selectedProvider.name.split(" ")[0]}
        </span>
      )}

      {/* Input */}
      <textarea
        ref={textareaRef}
        data-input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (!expanded && e.target.value.length > 0) onExpand();
        }}
        onFocus={onExpand}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything…"
        rows={1}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none leading-tight py-1"
        style={{ height: 28, maxHeight: 28, overflow: "hidden" }}
      />

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAttach}>
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach file</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleScreenshot}>
              <Camera className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Screenshot</TooltipContent>
        </Tooltip>

        {isStreaming ? (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancel}>
            <X className="h-3.5 w-3.5 text-destructive" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSubmit}
            disabled={!text.trim() && attachments.length === 0}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => ipc.openDashboard()}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open dashboard</TooltipContent>
        </Tooltip>

        {expanded && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCollapse}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
