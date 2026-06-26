"use client";

import { Bot, Cpu, Zap, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NODE_TYPES = [
  {
    type: "trigger",
    label: "Trigger",
    description: "Starts the pipeline",
    icon: Zap,
    color: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  },
  {
    type: "agent",
    label: "Agent",
    description: "Main AI worker",
    icon: Bot,
    color: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  },
  {
    type: "subagent",
    label: "Subagent",
    description: "Specialized helper",
    icon: Cpu,
    color: "border-violet-500/30 bg-violet-500/5 text-violet-400",
  },
  {
    type: "output",
    label: "Output",
    description: "Collects results",
    icon: ArrowRight,
    color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  },
];

export function Sidebar() {
  function onDragStart(e: React.DragEvent, type: string) {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Node Types
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Drag onto canvas
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-2 p-3 flex-1">
        {NODE_TYPES.map(({ type, label, description, icon: Icon, color }) => (
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
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          Connect nodes by dragging from the right handle of one node to the left handle of another.
        </p>
      </div>
    </aside>
  );
}
