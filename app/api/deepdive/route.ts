import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm";
import { buildDeepdivePrompt } from "@/lib/prompts";
import { ndjsonHeartbeat } from "@/lib/stream";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてから再試行してください。" },
      { status: 429 }
    );
  }

  const { term, industry } = (await req.json()) as {
    term?: string;
    industry?: string;
  };
  if (!term || !industry) {
    return NextResponse.json(
      { error: "term と industry は必須です。" },
      { status: 400 }
    );
  }

  return ndjsonHeartbeat(async () => {
    const prompt = buildDeepdivePrompt(term, industry);
    const text = await generate(prompt, { webSearch: false, maxTokens: 1200 });
    return { text };
  });
}
