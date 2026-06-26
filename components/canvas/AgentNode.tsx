"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Cpu, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AgentNodeData = {
  label: string;
  model: string;
  type: "agent" | "subagent" | "trigger" | "output";
  status?: "idle" | "running" | "done" | "error";
  description?: string;
};

const TYPE_CONFIG = {
  trigger: {
    icon: Zap,
    color: "border-amber-500/50 bg-amber-500/5",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    label: "Trigger",
  },
  agent: {
    icon: Bot,
    color: "border-blue-500/50 bg-blue-500/5",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Agent",
  },
  subagent: {
    icon: Cpu,
    color: "border-violet-500/50 bg-violet-500/5",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    label: "Subagent",
  },
  output: {
    icon: Bot,
    color: "border-emerald-500/50 bg-emerald-500/5",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Output",
  },
};

const STATUS_DOT: Record<string, string> = {
  idle: "bg-zinc-500",
  running: "bg-amber-400 animate-pulse",
  done: "bg-emerald-400",
  error: "bg-red-400",
};

export function AgentNode({ data, selected }: NodeProps) {
  const nodeData = data as AgentNodeData;
  const config = TYPE_CONFIG[nodeData.type] ?? TYPE_CONFIG.agent;
  const Icon = config.icon;
  const status = nodeData.status ?? "idle";

  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border-2 px-4 py-3 shadow-lg transition-all",
        config.color,
        selected && "ring-2 ring-white/20 ring-offset-1 ring-offset-transparent"
      )}
    >
      {nodeData.type !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !rounded-full !border-2 !border-zinc-600 !bg-zinc-900"
        />
      )}

      <div className="flex items-start gap-2">
        <div className={cn("mt-0.5 rounded-lg p-1.5 border", config.badge)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-medium text-foreground truncate">
              {nodeData.label}
            </span>
            <span
              className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_DOT[status])}
            />
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-4 font-mono border", config.badge)}
          >
            {nodeData.model.includes("/") ? nodeData.model.split("/")[1] : nodeData.model}
          </Badge>
          {nodeData.description && (
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-tight line-clamp-2">
              {nodeData.description}
            </p>
          )}
        </div>
      </div>

      {nodeData.type !== "output" && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !rounded-full !border-2 !border-zinc-600 !bg-zinc-900"
        />
      )}
    </div>
  );
}
