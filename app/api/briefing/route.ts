import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm";
import { buildBriefingPrompt, type Level } from "@/lib/prompts";

// Web 検索は時間がかかるためサーバー実行を長めに許可
export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { industry, level } = (await req.json()) as {
      industry?: string;
      level?: Level;
    };

    if (!industry || !level) {
      return NextResponse.json(
        { error: "industry と level は必須です。" },
        { status: 400 }
      );
    }

    const prompt = buildBriefingPrompt(industry, level);
    const text = await generate(prompt, { webSearch: true, maxTokens: 2048 });

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[briefing] error:", err);
    return NextResponse.json(
      { error: err?.message || "ブリーフィング生成に失敗しました。" },
      { status: 500 }
    );
  }
}
