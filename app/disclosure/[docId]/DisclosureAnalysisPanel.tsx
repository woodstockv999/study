"use client";

import { useState } from "react";
import type { DisclosureCache } from "@/lib/types";

interface Props {
  docId: string;
  filerName: string;
  docDescription: string;
  cached: DisclosureCache | null;
}

const SECTIONS = [
  { key: "overview"  as const, label: "事業概況",    icon: "📊" },
  { key: "changes"   as const, label: "重要な変化",  icon: "⚡" },
  { key: "risks"     as const, label: "リスク要因",  icon: "⚠️" },
  { key: "financials"as const, label: "財務ハイライト", icon: "💰" },
];

export default function DisclosureAnalysisPanel({ docId, filerName, docDescription, cached }: Props) {
  const [result, setResult] = useState<DisclosureCache | null>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/disclosure/${docId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filerName, docDescription }),
      });
      const data = await res.json();
      if (data.jobId) {
        pollJob(data.jobId);
      } else {
        setError("解析を開始できませんでした");
        setLoading(false);
      }
    } catch {
      setError("エラーが発生しました");
      setLoading(false);
    }
  };

  const pollJob = (jobId: string) => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/disclosure/${docId}/analyze?jobId=${jobId}`);
      const data = await res.json();
      if (data.status === "done") {
        clearInterval(timer);
        setResult(data.result);
        setLoading(false);
      } else if (data.status === "error") {
        clearInterval(timer);
        setError(data.error ?? "解析に失敗しました");
        setLoading(false);
      }
    }, 3000);
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-0.5 h-4 bg-accent rounded-sm" />
            <span className="text-sm font-bold text-ink uppercase tracking-wide">AI 要約</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted">解析日: {new Date(result.analyzedAt).toLocaleDateString("ja-JP")}</span>
            <button onClick={analyze} disabled={loading}
              className="text-2xs text-ink-muted hover:text-accent transition-colors disabled:opacity-50">
              再解析
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map(({ key, label, icon }) => (
            <div key={key} className="bg-paper-surface border border-paper-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{icon}</span>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">{label}</h3>
              </div>
              <ul className="space-y-2">
                {(result[key] ?? []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-mid leading-relaxed">
                    <span className="text-accent font-bold mt-0.5 shrink-0">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-2xs text-ink-faint text-center">この要約はAIによる自動生成です。投資判断の参考目的のみ。原文を必ず確認してください。</p>
      </div>
    );
  }

  return (
    <div className="bg-paper-surface border border-paper-border rounded-lg p-8 text-center space-y-4">
      <div>
        <p className="text-sm font-medium text-ink mb-1">この書類はまだ解析されていません</p>
        <p className="text-xs text-ink-muted">AIが本文を要約し、結果を永続保存します（再実行不要）</p>
      </div>
      {error && <p className="text-xs text-neg">{error}</p>}
      <button
        onClick={analyze}
        disabled={loading}
        className="px-6 py-2.5 bg-navy text-white text-sm rounded-lg hover:bg-navy-mid disabled:opacity-50 transition-colors"
      >
        {loading ? "解析中…（1〜2分）" : "AI解析を実行"}
      </button>
      <p className="text-2xs text-ink-faint">※ 一度解析すると次回からは即時表示されます</p>
    </div>
  );
}
