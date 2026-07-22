"use client";

import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type NodeResult = {
  nodeId: string;
  label: string;
  status: "running" | "done" | "error";
  output?: string;
  error?: string;
};

type Props = {
  results: NodeResult[];
  onClose: () => void;
};

export function OutputPanel({ results, onClose }: Props) {
  const { width, onMouseDown } = useResizablePanel({ defaultWidth: 320, min: 280, max: 800, side: "right" });

  return (
    <aside className="shrink-0 border-l border-border bg-card flex flex-col relative" style={{ width }}>
      {/* drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30 transition-colors z-10"
      />

      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold">Pipeline Output</p>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4">
          {results.map((r) => (
            <div key={r.nodeId} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                {r.status === "running" && (
                  <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" />
                )}
                {r.status === "done" && (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                )}
                {r.status === "error" && (
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                )}
                <span className="text-xs font-medium">{r.label}</span>
              </div>

              <div
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words",
                  r.status === "running" && "border-amber-500/20 bg-amber-500/5 text-muted-foreground italic",
                  r.status === "done" && "border-border bg-muted/40 text-foreground",
                  r.status === "error" && "border-red-500/20 bg-red-500/5 text-red-400"
                )}
              >
                {r.status === "running" && "Thinking…"}
                {r.status === "done" && r.output}
                {r.status === "error" && (r.error ?? "Something went wrong")}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
