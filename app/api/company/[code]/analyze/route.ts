import { NextRequest, NextResponse } from "next/server";
import { getCompanyDetail } from "@/lib/edinet";
import { writeCache } from "@/lib/cache";
import { generate } from "@/lib/llm";
import { buildCompanyAnalysisPrompt } from "@/lib/prompts";
import { createJob, resolveJob, rejectJob, getJob } from "@/lib/jobs";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { CompanyAnalysisCache } from "@/lib/types";

interface Ctx { params: Promise<{ code: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const { code } = await params;
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
  const job = getJob(jobId);
  if (!job) return NextResponse.json({ status: "not_found" }, { status: 404 });
  return NextResponse.json({ status: job.status, result: job.data, error: job.error });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてから再試行してください。" },
      { status: 429 }
    );
  }

  const { code } = await params;
  const company = await getCompanyDetail(code);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const jobId = createJob();

  // バックグラウンド実行
  (async () => {
    try {
      const prompt = buildCompanyAnalysisPrompt(company.filerName, company.financials);
      const text = await generate(prompt, { maxTokens: 1500 });
      const result: CompanyAnalysisCache = { edinetCode: code, filerName: company.filerName, text, analyzedAt: new Date().toISOString() };
      writeCache(`company-analysis/${code}`, result);
      resolveJob(jobId, result);
    } catch (e: any) {
      rejectJob(jobId, e.message);
    }
  })();

  return NextResponse.json({ jobId });
}
