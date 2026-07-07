import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import type { Material } from "@/components/canvas/AgentNode";

export type RunNodeRequest = {
  nodeId: string;
  label: string;
  description: string;
  model: string;
  inputText: string;
  materials?: Material[];
};

export type RunNodeResponse = {
  nodeId: string;
  output: string;
  error?: string;
};

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function resolveMaterials(materials: Material[]): Promise<string> {
  if (materials.length === 0) return "";

  const parts: string[] = [];
  for (const m of materials) {
    if (m.type === "text") {
      parts.push(`### ${m.label}\n${m.content}`);
    } else {
      try {
        const res = await fetch(m.content, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(5000),
        });
        const html = await res.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000);
        parts.push(`### ${m.label}\n${text}`);
      } catch {
        parts.push(`### ${m.label}\n[Link could not be fetched: ${m.content}]`);
      }
    }
  }

  return `## Reference Materials\n\n${parts.join("\n\n---\n\n")}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as RunNodeRequest;

  const systemPrompt = body.description?.trim()
    ? body.description
    : `You are ${body.label}, an AI agent. Process the input and produce a concise, useful output.`;

  const materialsContext = await resolveMaterials(body.materials ?? []);
  const prompt = materialsContext
    ? `${materialsContext}\n\n---\n\n${body.inputText || "Begin."}`
    : body.inputText || "Begin.";

  try {
    const { text } = await generateText({
      model: openrouter(body.model),
      system: systemPrompt,
      prompt,
      maxOutputTokens: 2048,
    });

    return NextResponse.json({ nodeId: body.nodeId, output: text } satisfies RunNodeResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { nodeId: body.nodeId, output: "", error: message } satisfies RunNodeResponse,
      { status: 500 }
    );
  }
}
