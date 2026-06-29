"use client";

import { useState } from "react";
import type { CompanyAnalysisCache } from "@/lib/types";

interface Props {
  edinetCode: string;
  filerName: string;
  cachedAnalysis: CompanyAnalysisCache | null;
}

export default function CompanyAnalysisPanel({ edinetCode, filerName, cachedAnalysis }: Props) {
  const [analysis, setAnalysis] = useState<CompanyAnalysisCache | null>(cachedAnalysis);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/company/${edinetCode}/analyze`, { method: "POST" });
      const { jobId: id } = await res.json();
      setJobId(id);
      poll(id);
    } catch {
      setLoading(false);
    }
  };

  const poll = async (id: string) => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/company/${edinetCode}/analyze?jobId=${id}`);
      const data = await res.json();
      if (data.status === "done") {
        clearInterval(timer);
        setAnalysis(data.result);
        setLoading(false);
      } else if (data.status === "error") {
        clearInterval(timer);
        setLoading(false);
      }
    }, 2000);
  };

  if (analysis) {
    return (
      <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
        <div className="bg-navy px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-0.5 h-4 bg-accent rounded-sm" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">AI 財務分析</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-navy-muted">{new Date(analysis.analyzedAt).toLocaleDateString("ja-JP")}</span>
            <button onClick={start} disabled={loading}
              className="text-2xs text-navy-muted hover:text-white transition-colors disabled:opacity-50">
              再分析
            </button>
          </div>
        </div>
        <div className="px-5 py-4 prose prose-sm max-w-none text-ink leading-relaxed whitespace-pre-wrap text-sm">
          {analysis.text}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper-surface border border-paper-border rounded-lg p-6 text-center">
      <p className="text-sm text-ink-muted mb-3">
        {filerName}の財務データをAIが分析します（結果は保存されます）
      </p>
      <button
        onClick={start}
        disabled={loading}
        className="px-4 py-2 bg-navy text-white text-sm rounded-lg hover:bg-navy-mid disabled:opacity-50 transition-colors"
      >
        {loading ? "分析中…（30秒ほど）" : "AI財務分析を実行"}
      </button>
    </div>
  );
}
