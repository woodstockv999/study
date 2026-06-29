"use client";

import { useState } from "react";
import { startJob, pollJob } from "@/lib/config";
import { addBriefing } from "@/lib/storage";
import Markdown from "./Markdown";

const QUICK_PICKS = [
  "NVIDIA", "OpenAI", "Microsoft", "Google", "Amazon",
  "Apple", "Meta", "トヨタ", "ソニー", "NTT",
  "富士通", "日立", "TSMC", "Anthropic", "SoftBank",
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

    setCompany(target);
    setLoading(true);
    setError("");
    setResult("");

    try {
      const jobId = await startJob("/api/spotlight", { company: target });
      const data = await pollJob<{ text: string }>("/api/spotlight/status", jobId);
      setResult(data.text);
      // 履歴に保存（enterprise: プレフィックスで識別）
      addBriefing({ industry: `企業: ${target}`, level: "実務", text: data.text });
      onHistoryUpdated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 検索パネル */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            企業・組織名
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="例: NVIDIA、トヨタ、OpenAI …"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            />
            <button
              type="button"
              onClick={() => search()}
              disabled={loading || !company.trim()}
              className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap transition"
            >
              {loading ? "調査中…" : "調査する"}
            </button>
          </div>
        </div>

        {/* クイックピック */}
        <div>
          <p className="text-xs text-slate-500 mb-2">よく調べられる企業</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PICKS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => search(name)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full text-xs border border-slate-200 text-slate-600 hover:border-accent hover:text-accent disabled:opacity-50 transition bg-white"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ローディング */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-accent" />
          <p className="mt-3 text-sm text-slate-600">
            {company} の最新情報を Web 検索中…
          </p>
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => search()}
            className="shrink-0 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 transition"
          >
            再試行
          </button>
        </div>
      )}

      {/* 結果 */}
      {result && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-medium">
              企業追跡
            </span>
            <span className="text-sm font-semibold text-slate-800">{company}</span>
          </div>
          <Markdown>{result}</Markdown>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-16 text-slate-400 text-sm">
          <p className="text-2xl mb-3">🔍</p>
          <p>企業名を入力するか、よく調べられる企業をクリックしてください</p>
        </div>
      )}
    </div>
  );
}
