"use client";

import { Bot, Cpu, Zap, ArrowRight, Users, MessageSquare, Eye, ClipboardList, BarChart2, FlaskConical } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useResizablePanel } from "@/hooks/useResizablePanel";

const PIPELINE_NODES = [
  { type: "trigger",  label: "Trigger",  description: "Starts the pipeline",  icon: Zap,      color: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
  { type: "agent",    label: "Agent",    description: "Main AI worker",        icon: Bot,      color: "border-blue-500/30 bg-blue-500/5 text-blue-400" },
  { type: "subagent", label: "Subagent", description: "Specialized helper",    icon: Cpu,      color: "border-violet-500/30 bg-violet-500/5 text-violet-400" },
  { type: "output",   label: "Output",   description: "Collects results",      icon: ArrowRight, color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
];

const QUALITATIVE_NODES = [
  { type: "user-interview", label: "User Interview", description: "1:1 depth interview",    icon: Users,        color: "border-rose-500/30 bg-rose-500/5 text-rose-400" },
  { type: "focus-group",    label: "Focus Group",    description: "Group discussion",        icon: MessageSquare, color: "border-pink-500/30 bg-pink-500/5 text-pink-400" },
  { type: "observation",    label: "Observation",    description: "Contextual field study",  icon: Eye,          color: "border-orange-500/30 bg-orange-500/5 text-orange-400" },
];

const QUANTITATIVE_NODES = [
  { type: "survey",        label: "Survey",        description: "Structured questionnaire", icon: ClipboardList, color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400" },
  { type: "data-analysis", label: "Data Analysis", description: "Metrics & patterns",       icon: BarChart2,     color: "border-teal-500/30 bg-teal-500/5 text-teal-400" },
  { type: "ab-test",       label: "A/B Test",      description: "Variant comparison",       icon: FlaskConical,  color: "border-sky-500/30 bg-sky-500/5 text-sky-400" },
];

function NodeGroup({ label, nodes, onDragStart }: {
  label: string;
  nodes: typeof PIPELINE_NODES;
  onDragStart: (e: React.DragEvent, type: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-1">
        {label}
      </p>
      {nodes.map(({ type, label: nodeLabel, description, icon: Icon, color }) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-grab active:cursor-grabbing select-none transition-colors hover:bg-muted/50",
            color
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{nodeLabel}</p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const { width, onMouseDown } = useResizablePanel({ defaultWidth: 224, min: 180, max: 480, side: "left" });

  function onDragStart(e: React.DragEvent, type: string) {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="shrink-0 border-r border-border bg-card flex flex-col relative" style={{ width }}>
      {/* drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30 transition-colors z-10"
      />

      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Node Types
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Drag onto canvas
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-3 p-3 flex-1 overflow-y-auto">
        <NodeGroup label="Pipeline" nodes={PIPELINE_NODES} onDragStart={onDragStart} />
        <Separator />
        <NodeGroup label="Qualitative" nodes={QUALITATIVE_NODES} onDragStart={onDragStart} />
        <Separator />
        <NodeGroup label="Quantitative" nodes={QUANTITATIVE_NODES} onDragStart={onDragStart} />
      </div>

      <Separator />

      <div className="px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          Connect nodes by dragging from the right handle to the left handle of another.
        </p>
      </div>
    </aside>
  );
}
