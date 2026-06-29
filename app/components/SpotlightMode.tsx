"use client";

import { useState } from "react";
import { startJob, pollJob } from "@/lib/config";
import { addBriefing } from "@/lib/storage";
import Markdown from "./Markdown";

const QUICK_PICKS = [
  "NVIDIA", "OpenAI", "Microsoft", "Google", "Amazon",
  "Apple", "Meta", "Anthropic", "TSMC", "SoftBank",
  "トヨタ", "ソニー", "NTT", "富士通", "日立",
];

interface Props {
  onHistoryUpdated: () => void;
}

export default function SpotlightMode({ onHistoryUpdated }: Props) {
  const [company, setCompany] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(name?: string) {
    const target = (name ?? company).trim();
    if (!target) return;
    setCompany(target); setLoading(true); setError(""); setResult("");
    try {
      const jobId = await startJob("/api/spotlight", { company: target });
      const data = await pollJob<{ text: string }>("/api/spotlight/status", jobId);
      setResult(data.text);
      addBriefing({ industry: `企業: ${target}`, level: "実務", text: data.text });
      onHistoryUpdated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 検索パネル */}
      <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
        <div className="bg-navy px-4 py-2.5 flex items-center gap-2">
          <span className="w-0.5 h-3.5 bg-accent rounded-sm block" />
          <span className="text-2xs font-bold text-white uppercase tracking-widest">企業追跡</span>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="企業・組織名を入力（例: NVIDIA、トヨタ…）"
              className="flex-1 border border-paper-border rounded px-3 py-1.5 text-sm bg-paper focus:border-navy-mid focus:ring-1 focus:ring-navy-mid outline-none"
            />
            <button
              type="button"
              onClick={() => search()}
              disabled={loading || !company.trim()}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-bold rounded px-4 py-1.5 whitespace-nowrap transition-colors uppercase tracking-wide"
            >
              {loading ? (
                <><span className="inline-block h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />調査中</>
              ) : "調査"}
            </button>
          </div>

          {/* クイックピック */}
          <div>
            <p className="text-2xs text-ink-faint uppercase tracking-wider mb-2">よく調べられる企業</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PICKS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => search(name)}
                  disabled={loading}
                  className="px-2 py-0.5 rounded text-2xs border border-paper-border text-ink-mid hover:border-navy-mid hover:text-navy disabled:opacity-40 transition-colors bg-paper"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 結果 */}
      {loading && (
        <div className="bg-paper-surface border border-paper-border rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block h-4 w-4 border-2 border-paper-border border-t-accent rounded-full animate-spin" />
            <span className="text-sm text-ink-muted">{company} の最新情報を Web 検索中…</span>
          </div>
          <div className="skeleton h-3 w-2/3" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
        </div>
      )}

      {error && (
        <div className="border border-accent-border bg-accent-soft rounded-lg px-4 py-3 text-sm text-accent flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => search()} className="shrink-0 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded px-3 py-1.5 transition-colors">再試行</button>
        </div>
      )}

      {result && !loading && (
        <article className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
          <div className="border-b border-paper-border px-4 py-3 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-navy text-white text-2xs font-bold uppercase tracking-wider">
              企業追跡
            </span>
            <span className="text-sm font-semibold text-ink">{company}</span>
          </div>
          <div className="px-4 sm:px-5 py-4">
            <Markdown>{result}</Markdown>
          </div>
        </article>
      )}

      {!result && !loading && !error && (
        <div className="border border-paper-border border-dashed rounded-lg py-14 text-center">
          <p className="text-3xl opacity-30 mb-3">🔍</p>
          <p className="text-sm text-ink-muted">企業名を入力するか、候補から選んでください</p>
        </div>
      )}
    </div>
  );
}
