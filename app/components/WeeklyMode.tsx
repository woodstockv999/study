"use client";

import { useState } from "react";
import { TECH_CATEGORIES } from "@/lib/prompts";
import { startJob, pollJob } from "@/lib/config";
import { addBriefing } from "@/lib/storage";
import Markdown from "./Markdown";

interface Props {
  onHistoryUpdated: () => void;
}

export default function WeeklyMode({ onHistoryUpdated }: Props) {
  const [category, setCategory] = useState("AI・生成AI");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true); setError(""); setResult("");
    try {
      const jobId = await startJob("/api/weekly", { category });
      const data = await pollJob<{ text: string }>("/api/weekly/status", jobId);
      setResult(data.text);
      addBriefing({ industry: `週次: ${category}`, level: "実務", text: data.text });
      onHistoryUpdated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
        <div className="bg-navy px-4 py-2.5 flex items-center gap-2">
          <span className="w-0.5 h-3.5 bg-accent rounded-sm block" />
          <span className="text-2xs font-bold text-white uppercase tracking-widest">週次まとめ</span>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-2xs text-ink-faint uppercase tracking-wider mb-2">カテゴリ</p>
            <div className="flex flex-wrap gap-1.5">
              {TECH_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.label)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                    category === c.label
                      ? "bg-navy text-white border-navy"
                      : "bg-paper text-ink-mid border-paper-border hover:border-navy-mid hover:text-navy"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-bold rounded px-4 py-2 transition-colors uppercase tracking-wide"
          >
            {loading ? (
              <><span className="inline-block h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中</>
            ) : "今週のまとめを生成"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-paper-surface border border-paper-border rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block h-4 w-4 border-2 border-paper-border border-t-accent rounded-full animate-spin" />
            <span className="text-sm text-ink-muted">今週の {category} ニュースを集めています…</span>
          </div>
          <div className="skeleton h-3 w-3/4" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
        </div>
      )}

      {error && (
        <div className="border border-accent-border bg-accent-soft rounded-lg px-4 py-3 text-sm text-accent flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={generate} className="shrink-0 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded px-3 py-1.5 transition-colors">再試行</button>
        </div>
      )}

      {result && !loading && (
        <article className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
          <div className="border-b border-paper-border px-4 py-3 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-navy text-white text-2xs font-bold uppercase tracking-wider">
              週次まとめ
            </span>
            <span className="text-sm font-semibold text-ink">{category}</span>
          </div>
          <div className="px-4 sm:px-5 py-4">
            <Markdown>{result}</Markdown>
          </div>
        </article>
      )}

      {!result && !loading && !error && (
        <div className="border border-paper-border border-dashed rounded-lg py-14 text-center">
          <p className="text-3xl opacity-30 mb-3">📅</p>
          <p className="text-sm text-ink-muted">カテゴリを選んで今週のまとめを生成してください</p>
          <p className="text-xs text-ink-faint mt-1">直近 7 日間のニュースをまとめます</p>
        </div>
      )}
    </div>
  );
}
