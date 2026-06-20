import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm";
import { buildQuizPrompt } from "@/lib/prompts";

export const maxDuration = 120;
export const runtime = "nodejs";

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

// モデルが ```json ... ``` 等で包んでも拾えるよう JSON 本体を抽出
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { briefing } = (await req.json()) as { briefing?: string };
    if (!briefing) {
      return NextResponse.json(
        { error: "briefing 本文が必要です。" },
        { status: 400 }
      );
    }

    const prompt = buildQuizPrompt(briefing);
    const raw = await generate(prompt, { webSearch: false, maxTokens: 1500 });

    let parsed: { questions: QuizQuestion[] };
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch {
      return NextResponse.json(
        { error: "クイズの生成結果を解析できませんでした。もう一度お試しください。" },
        { status: 502 }
      );
    }

    if (!parsed?.questions?.length) {
      return NextResponse.json(
        { error: "クイズを生成できませんでした。" },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions: parsed.questions });
  } catch (err: any) {
    console.error("[quiz] error:", err);
    return NextResponse.json(
      { error: err?.message || "クイズ生成に失敗しました。" },
      { status: 500 }
    );
  }
}
