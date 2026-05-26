import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemPromptDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SystemPrompt } from "@/lib/types";

export function PromptsSettings() {
  const qc = useQueryClient();
  const { data: prompts = [] } = useQuery({
    queryKey: ["system_prompts"],
    queryFn: () => systemPromptDb.list(),
  });
  const { mutate: deletePrompt } = useMutation({
    mutationFn: (id: string) => systemPromptDb.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system_prompts"] }),
  });
  const { mutate: savePrompt } = useMutation({
    mutationFn: ({ id, name, body }: { id?: string; name: string; body: string }) =>
      id
        ? systemPromptDb.update(id, name, body)
        : systemPromptDb.create(name, body).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system_prompts"] });
      setEditing(null);
    },
  });

  const [editing, setEditing] = useState<Partial<SystemPrompt> | null>(null);

  function startNew() {
    setEditing({ name: "", body: "" });
  }

  return (
    <div className="flex gap-6">
      <div className="w-64 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">System prompts</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startNew}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {prompts.map((p) => (
          <div
            key={p.id}
            onClick={() => setEditing(p)}
            className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
              editing && "id" in editing && editing.id === p.id ? "bg-accent" : "hover:bg-accent/50"
            }`}
          >
            <span className="text-sm truncate">{p.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                deletePrompt(p.id);
                if (editing && "id" in editing && editing.id === p.id) setEditing(null);
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
        {prompts.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">No prompts yet</p>
        )}
      </div>

      {editing && (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">{editing.id ? "Edit prompt" : "New prompt"}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => savePrompt({ id: editing.id, name: editing.name!, body: editing.body! })}
                disabled={!editing.name?.trim() || !editing.body?.trim()}
              >
                Save
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input
              value={editing.name ?? ""}
              onChange={(e) => setEditing((s) => s ? { ...s, name: e.target.value } : s)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Prompt</Label>
            <Textarea
              value={editing.body ?? ""}
              onChange={(e) => setEditing((s) => s ? { ...s, body: e.target.value } : s)}
              className="min-h-[200px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
