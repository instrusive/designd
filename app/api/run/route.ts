import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export type RunNodeRequest = {
  nodeId: string;
  label: string;
  description: string;
  model: string;
  inputText: string;
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

function resolveModel(modelValue: string) {
  return openrouter(modelValue);
}

export async function POST(req: Request) {
  const body = (await req.json()) as RunNodeRequest;

  const systemPrompt = body.description?.trim()
    ? body.description
    : `You are ${body.label}, an AI agent. Process the input and produce a concise, useful output.`;

  try {
    const { text } = await generateText({
      model: resolveModel(body.model),
      system: systemPrompt,
      prompt: body.inputText || "Begin.",
      maxOutputTokens: 512,
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
