import { NextRequest, NextResponse } from "next/server";
import { getMockDocumentContent } from "@/lib/edinet";
import { writeCache } from "@/lib/cache";
import { generate } from "@/lib/llm";
import { buildDisclosurePrompt } from "@/lib/prompts";
import { createJob, resolveJob, rejectJob, getJob } from "@/lib/jobs";
import type { DisclosureCache } from "@/lib/types";

interface Ctx { params: Promise<{ docId: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const { docId } = await params;
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
  const job = getJob(jobId);
  if (!job) return NextResponse.json({ status: "not_found" }, { status: 404 });
  return NextResponse.json({ status: job.status, result: job.data, error: job.error });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { docId } = await params;
  const { filerName = "不明", docDescription = docId } = await req.json().catch(() => ({}));

  const jobId = createJob();

  (async () => {
    try {
      // デモモード: モックテキストを使用。実APIがあればEDINETから文書取得
      const content = getMockDocumentContent(docId, filerName);
      const prompt = buildDisclosurePrompt(filerName, docDescription, content);
      const text = await generate(prompt, { maxTokens: 1200 });

      // JSON抽出
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("JSON parse failed");
      const parsed = JSON.parse(match[0]);

      const result: DisclosureCache = {
        docID: docId, filerName, docDescription,
        overview: parsed.overview ?? [],
        changes: parsed.changes ?? [],
        risks: parsed.risks ?? [],
        financials: parsed.financials ?? [],
        analyzedAt: new Date().toISOString(),
      };
      writeCache(`disclosure/${docId}`, result);
      resolveJob(jobId, result);
    } catch (e: any) {
      rejectJob(jobId, e.message);
    }
  })();

  return NextResponse.json({ jobId });
}
