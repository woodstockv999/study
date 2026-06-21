import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm";
import { buildBriefingPrompt, type Level } from "@/lib/prompts";
import { ndjsonHeartbeat } from "@/lib/stream";

// Web 検索は時間がかかるためサーバー実行を長めに許可
export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  // 数十秒かかるためハートビート付きストリーミングで返す（モバイル接続維持）
  return ndjsonHeartbeat(async () => {
    const prompt = buildBriefingPrompt(industry, level);
    const text = await generate(prompt, { webSearch: true, maxTokens: 2048 });
    return { text };
  });
}
