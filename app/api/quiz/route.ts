import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm";
import { buildQuizPrompt } from "@/lib/prompts";
import { createJob, resolveJob, rejectJob } from "@/lib/jobs";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

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
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてから再試行してください。" },
      { status: 429 }
    );
  }

  const { briefing } = (await req.json()) as { briefing?: string };
  if (!briefing) {
    return NextResponse.json(
      { error: "briefing 本文が必要です。" },
      { status: 400 }
    );
  }

  const jobId = createJob();

  // クライアント（Safari）が切断しても処理が止まらないよう、
  // レスポンスを先に返してから非同期でジョブを実行する
  void (async () => {
    try {
      const prompt = buildQuizPrompt(briefing);
      const raw = await generate(prompt, { webSearch: false, maxTokens: 1500 });

      let parsed: { questions: QuizQuestion[] };
      try {
        parsed = JSON.parse(extractJson(raw));
      } catch {
        throw new Error(
          "クイズの生成結果を解析できませんでした。もう一度お試しください。"
        );
      }
      if (!parsed?.questions?.length) {
        throw new Error("クイズを生成できませんでした。");
      }
      resolveJob(jobId, { questions: parsed.questions });
    } catch (err: any) {
      rejectJob(jobId, err?.message || "処理に失敗しました。");
    }
  })();

  return NextResponse.json({ jobId });
}
