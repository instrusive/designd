"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Cpu, Zap, Users, MessageSquare, Eye, ClipboardList, BarChart2, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Material = {
  id: string;
  type: "text" | "link" | "image" | "figma";
  label: string;
  content: string;
};

export type AgentNodeData = {
  label: string;
  model: string;
  type: "agent" | "subagent" | "trigger" | "output" | "user-interview" | "focus-group" | "observation" | "survey" | "data-analysis" | "ab-test";
  status?: "idle" | "running" | "done" | "error";
  description?: string;
  materials?: Material[];
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
  "user-interview": {
    icon: Users,
    color: "border-rose-500/50 bg-rose-500/5",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    label: "User Interview",
  },
  "focus-group": {
    icon: MessageSquare,
    color: "border-pink-500/50 bg-pink-500/5",
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    label: "Focus Group",
  },
  "observation": {
    icon: Eye,
    color: "border-orange-500/50 bg-orange-500/5",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    label: "Observation",
  },
  "survey": {
    icon: ClipboardList,
    color: "border-cyan-500/50 bg-cyan-500/5",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    label: "Survey",
  },
  "data-analysis": {
    icon: BarChart2,
    color: "border-teal-500/50 bg-teal-500/5",
    badge: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    label: "Data Analysis",
  },
  "ab-test": {
    icon: FlaskConical,
    color: "border-sky-500/50 bg-sky-500/5",
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    label: "A/B Test",
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
        "w-[160px] rounded-xl border-2 px-3 py-2.5 shadow-lg transition-all",
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
        <div className={cn("mt-0.5 rounded-lg p-1.5 border shrink-0", config.badge)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1 mb-0.5">
            <span className="text-sm font-medium text-foreground leading-snug break-words flex-1">
              {nodeData.label}
            </span>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 mt-1.5", STATUS_DOT[status])} />
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-4 font-mono border w-full truncate block", config.badge)}
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
