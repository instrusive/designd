"use client";

import { Trash2, Play, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  onClear: () => void;
  onRun: () => void;
  onReset: () => void;
  nodeCount: number;
  running: boolean;
};

export function Toolbar({ onClear, onRun, onReset, nodeCount, running }: Props) {
  return (
    <header className="flex h-12 items-center gap-3 border-b border-border bg-card px-4 shrink-0">
      <span className="text-sm font-semibold tracking-tight">designd</span>
      <span className="text-xs text-muted-foreground">
        by{" "}
        <a
          href="https://www.madebylianna.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Lianna Lamorena
        </a>
      </span>
      <span className="text-xs text-muted-foreground font-mono">
        {nodeCount} node{nodeCount !== 1 ? "s" : ""}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Separator orientation="vertical" className="h-4" />
        <Button size="sm" variant="ghost" onClick={onReset} disabled={running} className="h-7 gap-1.5 text-xs">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={running} className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive">
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
        <Button size="sm" onClick={onRun} disabled={running} className="h-7 gap-1.5 text-xs">
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {running ? "Running…" : "Run Pipeline"}
        </Button>
      </div>
    </header>
  );
}
