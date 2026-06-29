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
    setLoading(true);
    setError("");
    setResult("");

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
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            {TECH_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.label)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  category === c.label
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-slate-700 border-slate-300 hover:border-accent"
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
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 transition"
        >
          {loading ? "週次まとめを生成中…" : "今週のまとめを生成する"}
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-accent" />
          <p className="mt-3 text-sm text-slate-600">
            今週の {category} ニュースを集めています…
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={generate}
            className="shrink-0 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 transition"
          >
            再試行
          </button>
        </div>
      )}

      {result && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-medium">
              週次まとめ
            </span>
            <span className="text-sm font-semibold text-slate-800">{category}</span>
          </div>
          <Markdown>{result}</Markdown>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-16 text-slate-400 text-sm">
          <p className="text-2xl mb-3">📅</p>
          <p>カテゴリを選んで今週のまとめを生成してください</p>
          <p className="mt-1 text-xs">直近7日間のニュースをWeb検索してまとめます</p>
        </div>
      )}
    </div>
  );
}
