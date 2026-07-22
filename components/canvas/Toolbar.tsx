"use client";

import { Trash2, Play, RotateCcw, Loader2, PanelRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  onClear: () => void;
  onRun: () => void;
  onReset: () => void;
  onShowOutput: () => void;
  onOpenKeys: () => void;
  outputVisible: boolean;
  hasKeys: boolean;
  nodeCount: number;
  running: boolean;
  hasResults: boolean;
};

export function Toolbar({ onClear, onRun, onReset, onShowOutput, onOpenKeys, outputVisible, hasKeys, nodeCount, running, hasResults }: Props) {
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
        <Button size="sm" variant="ghost" onClick={onOpenKeys} className="h-7 gap-1.5 text-xs relative">
          <KeyRound className="h-3 w-3" />
          API Keys
          {hasKeys && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <Button size="sm" variant="ghost" onClick={onReset} disabled={running} className="h-7 gap-1.5 text-xs">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={running} className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive">
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
        {hasResults && !running && (
          <Button size="sm" variant={outputVisible ? "secondary" : "outline"} onClick={onShowOutput} className="h-7 gap-1.5 text-xs">
            <PanelRight className="h-3 w-3" />
            {outputVisible ? "Hide Output" : "View Output"}
          </Button>
        )}
        <Button size="sm" onClick={onRun} disabled={running} className="h-7 gap-1.5 text-xs">
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {running ? "Running…" : "Run Pipeline"}
        </Button>
      </div>
    </header>
  );
}
