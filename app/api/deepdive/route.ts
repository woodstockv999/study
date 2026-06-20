import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm";
import { buildDeepdivePrompt } from "@/lib/prompts";

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
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

    const prompt = buildDeepdivePrompt(term, industry);
    const text = await generate(prompt, { webSearch: false, maxTokens: 1200 });

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[deepdive] error:", err);
    return NextResponse.json(
      { error: err?.message || "深掘りに失敗しました。" },
      { status: 500 }
    );
  }
}
