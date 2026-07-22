"use client";

import { useState } from "react";
import { KeyRound, ExternalLink, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export type ApiKeys = {
  google?: string;
  anthropic?: string;
};

export const KEYS_STORAGE_KEY = "designd-api-keys";

export function loadKeys(): ApiKeys {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ApiKeys) : {};
  } catch { return {}; }
}

export function saveKeys(keys: ApiKeys) {
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
}

export function hasUsableKey(keys: ApiKeys) {
  return !!(keys.google || keys.anthropic);
}

type Props = {
  open: boolean;
  onClose: () => void;
  initialKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
};

export function ApiKeyModal({ open, onClose, initialKeys, onSave }: Props) {
  const [google, setGoogle] = useState(initialKeys.google ?? "");
  const [anthropic, setAnthropic] = useState(initialKeys.anthropic ?? "");

  const canSave = google.trim() || anthropic.trim();

  function handleSave() {
    const keys: ApiKeys = {
      google: google.trim() || undefined,
      anthropic: anthropic.trim() || undefined,
    };
    saveKeys(keys);
    onSave(keys);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <DialogTitle>Add your API key</DialogTitle>
          </div>
          <DialogDescription>
            To run the pipeline, add an API key from one of the providers below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
            Your API keys are stored locally in your browser only. They are never sent to or saved by this application — only passed directly to the AI provider when you run a pipeline.
          </p>
        </div>

        <div className="flex flex-col gap-4 py-2">
          {/* Google */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Google AI Studio</Label>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                Free tier available
              </Badge>
            </div>
            <Input
              type="password"
              value={google}
              onChange={(e) => setGoogle(e.target.value)}
              placeholder="AIza..."
              className="text-sm font-mono"
            />
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              Get a free key at aistudio.google.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <Separator />

          {/* Anthropic */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Anthropic <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              type="password"
              value={anthropic}
              onChange={(e) => setAnthropic(e.target.value)}
              placeholder="sk-ant-..."
              className="text-sm font-mono"
            />
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              Get a key at console.anthropic.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-muted-foreground">At least one key required to run the pipeline.</p>
          <Button onClick={handleSave} disabled={!canSave} size="sm" className="gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
