"use client";

import { useState, useRef } from "react";
import { X, Plus, Link, FileText, Trash2, Image, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { AgentNodeData, Material } from "./AgentNode";

const MODELS: { value: string; label: string; free: boolean }[] = [
  // Free models (via OpenRouter :free tier)
  { value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B",          free: true },
  { value: "google/gemini-2.5-flash-preview:free",   label: "Gemini 2.5 Flash",        free: true },
  { value: "deepseek/deepseek-r1:free",              label: "DeepSeek R1",             free: true },
  { value: "mistralai/mistral-7b-instruct:free",     label: "Mistral 7B",              free: true },
  { value: "qwen/qwen3-235b-a22b:free",              label: "Qwen3 235B",              free: true },
  // Paid models
  { value: "anthropic/claude-sonnet-4-5",            label: "Claude Sonnet 4.5",       free: false },
  { value: "anthropic/claude-haiku-4-5",             label: "Claude Haiku 4.5",        free: false },
  { value: "openai/gpt-4o",                          label: "GPT-4o",                  free: false },
  { value: "openai/gpt-4o-mini",                     label: "GPT-4o Mini",             free: false },
  { value: "google/gemini-2.5-pro",                  label: "Gemini 2.5 Pro",          free: false },
];

type MaterialType = Material["type"];

const TYPE_META: Record<MaterialType, { icon: React.ElementType; label: string }> = {
  link:  { icon: Link,     label: "Link"  },
  text:  { icon: FileText, label: "Text"  },
  image: { icon: Image,    label: "Image" },
  figma: { icon: PenTool,  label: "Figma" },
};

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type Props = {
  nodeId: string;
  data: AgentNodeData;
  onChange: (id: string, data: Partial<AgentNodeData>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function NodeEditor({ nodeId, data, onChange, onDelete, onClose }: Props) {
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<MaterialType>("link");
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const materials = data.materials ?? [];

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setNewContent(compressed);
    if (!newLabel) setNewLabel(file.name.replace(/\.[^.]+$/, ""));
  }

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

  function cancelAdding() {
    setAdding(false);
    setNewLabel("");
    setNewContent("");
    setNewType("link");
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
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            value={data.label}
            onChange={(e) => onChange(nodeId, { label: e.target.value })}
            className="h-8 text-sm"
            placeholder="e.g. Research Agent"
          />
        </div>

        {/* Model */}
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

        {/* Prompt */}
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

        {/* Materials */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Materials</Label>
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            )}
          </div>

          {/* Material list */}
          {materials.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {materials.map((m) => {
                const Icon = TYPE_META[m.type].icon;
                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2"
                  >
                    {m.type === "image" ? (
                      <img
                        src={m.content}
                        alt={m.label}
                        className="h-8 w-8 rounded object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <Icon className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                    )}
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
                );
              })}
            </div>
          )}

          {/* Add form */}
          {adding && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2.5">
              {/* Type selector */}
              <div className="grid grid-cols-4 gap-1">
                {(Object.entries(TYPE_META) as [MaterialType, typeof TYPE_META[MaterialType]][]).map(([t, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={t}
                      onClick={() => { setNewType(t); setNewContent(""); }}
                      className={`flex flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[10px] border transition-colors ${
                        newType === t
                          ? "border-primary text-foreground bg-primary/10"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-7 text-xs"
                placeholder="Label (optional)"
              />

              {newType === "link" && (
                <Input
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="h-7 text-xs"
                  placeholder="https://..."
                />
              )}

              {newType === "text" && (
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="text-xs resize-none min-h-[80px]"
                  placeholder="Paste your text, notes, or brief here…"
                />
              )}

              {newType === "image" && (
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFile}
                  />
                  {newContent ? (
                    <div className="relative">
                      <img src={newContent} alt="preview" className="w-full rounded border border-border object-cover max-h-32" />
                      <button
                        onClick={() => setNewContent("")}
                        className="absolute top-1 right-1 bg-black/60 rounded p-0.5 text-white hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 rounded border border-dashed border-border py-4 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      <Image className="h-3.5 w-3.5" />
                      Click to upload image
                    </button>
                  )}
                </div>
              )}

              {newType === "figma" && (
                <div className="flex flex-col gap-1.5">
                  <Input
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="h-7 text-xs"
                    placeholder="https://www.figma.com/design/..."
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Requires <span className="text-foreground font-mono">FIGMA_ACCESS_TOKEN</span> in your environment.
                  </p>
                </div>
              )}

              <div className="flex gap-1.5 justify-end">
                <button
                  onClick={cancelAdding}
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
              Attach docs, images, links, or Figma frames for this agent to reference.
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="px-4 py-3 flex flex-col gap-2">
        <button
          onClick={() => onDelete(nodeId)}
          className="flex items-center justify-center gap-1.5 w-full rounded-md border border-destructive/40 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Delete node
        </button>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Free models need a <span className="text-foreground font-medium">Google AI</span> or <span className="text-foreground font-medium">Groq</span> API key — both have generous free tiers.
        </p>
      </div>
    </aside>
  );
}
