import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm";
import { buildBriefingPrompt, type Level } from "@/lib/prompts";
import { createJob, resolveJob, rejectJob } from "@/lib/jobs";

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

  const jobId = createJob();

  // クライアント（Safari）が切断しても処理が止まらないよう、
  // レスポンスを先に返してから非同期でジョブを実行する
  void (async () => {
    try {
      const prompt = buildBriefingPrompt(industry, level);
      const text = await generate(prompt, { webSearch: true, maxTokens: 2048 });
      resolveJob(jobId, { text });
    } catch (err: any) {
      rejectJob(jobId, err?.message || "処理に失敗しました。");
    }
  })();

  return NextResponse.json({ jobId });
}
