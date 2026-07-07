"use client";

import { useState } from "react";
import { X, Plus, Link, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { AgentNodeData, Material } from "./AgentNode";

const MODELS: { value: string; label: string; free: boolean }[] = [
  // Free models
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", free: true },
  { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash", free: true },
  { value: "groq/llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)", free: true },
  { value: "groq/llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Groq)", free: true },
  { value: "groq/mixtral-8x7b-32768", label: "Mixtral 8x7B (Groq)", free: true },
  // Paid models
  { value: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", free: false },
  { value: "anthropic/claude-opus-4-8", label: "Claude Opus 4.8", free: false },
  { value: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5", free: false },
  { value: "openai/gpt-4o", label: "GPT-4o", free: false },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", free: false },
];

type Props = {
  nodeId: string;
  data: AgentNodeData;
  onChange: (id: string, data: Partial<AgentNodeData>) => void;
  onClose: () => void;
};

export function NodeEditor({ nodeId, data, onChange, onClose }: Props) {
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<"text" | "link">("link");
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");

  const materials = data.materials ?? [];

  function saveMaterial() {
    if (!newContent.trim()) return;
    const material: Material = {
      id: crypto.randomUUID(),
      type: newType,
      label: newLabel.trim() || newContent.trim().slice(0, 50),
      content: newContent.trim(),
    };
    onChange(nodeId, { materials: [...materials, material] });
    setAdding(false);
    setNewLabel("");
    setNewContent("");
    setNewType("link");
  }

  function removeMaterial(id: string) {
    onChange(nodeId, { materials: materials.filter((m) => m.id !== id) });
  }

  return (
    <aside className="w-64 shrink-0 border-l border-border bg-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold">Edit Node</p>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            value={data.label}
            onChange={(e) => onChange(nodeId, { label: e.target.value })}
            className="h-8 text-sm"
            placeholder="e.g. Research Agent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Model</Label>
          <select
            value={data.model}
            onChange={(e) => onChange(nodeId, { model: e.target.value })}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
          >
            <optgroup label="Free">
              {MODELS.filter((m) => m.free).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </optgroup>
            <optgroup label="Paid">
              {MODELS.filter((m) => !m.free).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </optgroup>
          </select>
          {MODELS.find((m) => m.value === data.model)?.free && (
            <Badge variant="outline" className="w-fit text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
              Free tier available
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Description / Prompt</Label>
          <Textarea
            value={data.description ?? ""}
            onChange={(e) => onChange(nodeId, { description: e.target.value })}
            className="text-sm resize-none min-h-[100px]"
            placeholder="What does this agent do?"
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Materials</Label>
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            )}
          </div>

          {materials.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2"
                >
                  {m.type === "link"
                    ? <Link className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    : <FileText className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                  }
                  <span className="text-[11px] text-foreground leading-tight flex-1 truncate" title={m.label}>
                    {m.label}
                  </span>
                  <button
                    onClick={() => removeMaterial(m.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {adding && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2.5">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setNewType("link")}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] border transition-colors ${newType === "link" ? "border-primary text-foreground bg-primary/10" : "border-border text-muted-foreground"}`}
                >
                  <Link className="h-3 w-3" /> Link
                </button>
                <button
                  onClick={() => setNewType("text")}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] border transition-colors ${newType === "text" ? "border-primary text-foreground bg-primary/10" : "border-border text-muted-foreground"}`}
                >
                  <FileText className="h-3 w-3" /> Text
                </button>
              </div>

              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-7 text-xs"
                placeholder="Label (optional)"
              />

              {newType === "link" ? (
                <Input
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="h-7 text-xs"
                  placeholder="https://..."
                />
              ) : (
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="text-xs resize-none min-h-[80px]"
                  placeholder="Paste your text, notes, or brief here…"
                />
              )}

              <div className="flex gap-1.5 justify-end">
                <button
                  onClick={() => { setAdding(false); setNewLabel(""); setNewContent(""); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMaterial}
                  disabled={!newContent.trim()}
                  className="text-[11px] font-medium bg-primary text-primary-foreground rounded px-2 py-1 disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {materials.length === 0 && !adding && (
            <p className="text-[11px] text-muted-foreground">
              Attach docs, briefs, or links for this agent to reference.
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="px-4 py-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Free models need a <span className="text-foreground font-medium">Google AI</span> or <span className="text-foreground font-medium">Groq</span> API key — both have generous free tiers.
        </p>
      </div>
    </aside>
  );
}
