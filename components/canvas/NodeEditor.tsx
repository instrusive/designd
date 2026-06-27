"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { AgentNodeData } from "./AgentNode";

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
