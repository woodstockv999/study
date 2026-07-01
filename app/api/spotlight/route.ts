import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm";
import { buildSpotlightPrompt } from "@/lib/prompts";
import { createJob, resolveJob, rejectJob } from "@/lib/jobs";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてから再試行してください。" },
      { status: 429 }
    );
  }

  const { company } = (await req.json()) as { company?: string };

  if (!company?.trim()) {
    return NextResponse.json(
      { error: "company（企業名）は必須です。" },
      { status: 400 }
    );
  }

  const jobId = createJob();

  void (async () => {
    try {
      const prompt = buildSpotlightPrompt(company.trim());
      const text = await generate(prompt, { webSearch: true, maxTokens: 2048 });
      resolveJob(jobId, { text });
    } catch (err: any) {
      rejectJob(jobId, err?.message || "処理に失敗しました。");
    }
  })();

  return NextResponse.json({ jobId });
}
