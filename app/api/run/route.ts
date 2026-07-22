import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
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
  workflowMd?: string;
  clientKeys?: { google?: string; anthropic?: string };
};

export type RunNodeResponse = {
  nodeId: string;
  output: string;
  error?: string;
};

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  headers: {
    "HTTP-Referer": "https://designd.vercel.app",
    "X-Title": "designd",
  },
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

function resolveModel(modelId: string, clientKeys?: { google?: string; anthropic?: string }) {
  if (modelId.startsWith("anthropic/")) {
    const key = clientKeys?.anthropic || process.env.ANTHROPIC_API_KEY || "";
    return createAnthropic({ apiKey: key })(modelId.replace("anthropic/", ""));
  }
  if (modelId.startsWith("google/")) {
    const key = clientKeys?.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    return createGoogleGenerativeAI({ apiKey: key })(modelId.replace("google/", ""));
  }
  return openrouter(modelId);
}

function parseDataUrl(dataUrl: string): { base64: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  const match = url.match(/figma\.com\/(?:file|design|board)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  try {
    const nodeId = (new URL(url).searchParams.get("node-id") ?? "0:1").replace("-", ":");
    return { fileKey: match[1], nodeId };
  } catch { return null; }
}

async function fetchFigmaImage(url: string): Promise<{ base64: string; mimeType: string } | null> {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) return null;

  const parsed = parseFigmaUrl(url);
  if (!parsed) return null;

  try {
    const res = await fetch(
      `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${encodeURIComponent(parsed.nodeId)}&format=png&scale=2`,
      { headers: { "X-Figma-Token": token }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { images: Record<string, string> };
    const imageUrl = Object.values(data.images)[0];
    if (!imageUrl) return null;

    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    const buffer = await imgRes.arrayBuffer();
    return { base64: Buffer.from(buffer).toString("base64"), mimeType: "image/png" };
  } catch { return null; }
}

type ImagePart = { type: "image"; image: string; mimeType: string };
type TextPart  = { type: "text";  text: string };

export async function POST(req: Request) {
  const body = (await req.json()) as RunNodeRequest;
  const isAnthropic = body.model?.startsWith("anthropic/");
  const isGoogle = body.model?.startsWith("google/");
  const { clientKeys } = body;

  if (isAnthropic && !clientKeys?.anthropic && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { nodeId: body.nodeId, output: "", error: "No Anthropic API key found. Add one via the API Keys button in the toolbar." } satisfies RunNodeResponse,
      { status: 500 }
    );
  }
  if (isGoogle && !clientKeys?.google && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { nodeId: body.nodeId, output: "", error: "No Google API key found. Add one via the API Keys button in the toolbar." } satisfies RunNodeResponse,
      { status: 500 }
    );
  }
  if (!isAnthropic && !isGoogle && !process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { nodeId: body.nodeId, output: "", error: "OPENROUTER_API_KEY is not set. Add it to your .env.local file (local) or Vercel Environment Variables (deployed)." } satisfies RunNodeResponse,
      { status: 500 }
    );
  }

  const basePrompt = body.description?.trim()
    ? body.description
    : `You are ${body.label}, an AI agent. Process the input and produce a concise, useful output.`;

  const systemPrompt = body.workflowMd?.trim()
    ? `${basePrompt}\n\n---\n\n## Personal Workflow Guide\n\n${body.workflowMd.trim()}`
    : basePrompt;

  // Resolve materials into text parts and image parts
  const textMaterials: string[] = [];
  const imageParts: ImagePart[] = [];

  for (const m of body.materials ?? []) {
    if (m.type === "text") {
      textMaterials.push(`### ${m.label}\n${m.content}`);
    } else if (m.type === "link") {
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
        textMaterials.push(`### ${m.label}\n${text}`);
      } catch {
        textMaterials.push(`### ${m.label}\n[Could not fetch: ${m.content}]`);
      }
    } else if (m.type === "image") {
      const parsed = parseDataUrl(m.content);
      if (parsed) imageParts.push({ type: "image", image: parsed.base64, mimeType: parsed.mimeType });
    } else if (m.type === "figma") {
      const img = await fetchFigmaImage(m.content);
      if (img) {
        imageParts.push({ type: "image", image: img.base64, mimeType: img.mimeType });
      } else {
        textMaterials.push(`### ${m.label}\n[Figma frame could not be fetched — check your FIGMA_ACCESS_TOKEN]`);
      }
    }
  }

  const materialsText = textMaterials.length > 0
    ? `## Reference Materials\n\n${textMaterials.join("\n\n---\n\n")}`
    : "";

  const promptText = materialsText
    ? `${materialsText}\n\n---\n\n${body.inputText || "Begin."}`
    : body.inputText || "Begin.";

  try {
    const { text } = await generateText({
      model: resolveModel(body.model, clientKeys),
      system: systemPrompt,
      ...(imageParts.length > 0
        ? {
            messages: [
              {
                role: "user" as const,
                content: [
                  { type: "text" as const, text: promptText } satisfies TextPart,
                  ...imageParts,
                ],
              },
            ],
          }
        : { prompt: promptText }),
      maxOutputTokens: 2048,
    });

    return NextResponse.json({ nodeId: body.nodeId, output: text } satisfies RunNodeResponse);
  } catch (err) {
    let message = err instanceof Error ? err.message : "Unknown error";
    // Surface the actual response body from OpenRouter for clearer debugging
    if (err && typeof err === "object" && "responseBody" in err && typeof err.responseBody === "string") {
      try {
        const body = JSON.parse(err.responseBody) as { error?: { message?: string } };
        if (body.error?.message) message = body.error.message;
      } catch {}
    }
    return NextResponse.json(
      { nodeId: body.nodeId, output: "", error: message } satisfies RunNodeResponse,
      { status: 500 }
    );
  }
}
