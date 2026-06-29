"use client";

import { useState } from "react";
import { TECH_CATEGORIES, LEVELS, type Level } from "@/lib/prompts";
import { startJob, pollJob } from "@/lib/config";
import { addBriefing, type BriefingRecord } from "@/lib/storage";
import Markdown from "./Markdown";

interface MorningJob {
  category: string;
  jobId: string | null;
  status: "loading" | "done" | "error";
  text?: string;
  error?: string;
  record?: BriefingRecord;
}

interface Props {
  onHistoryUpdated: () => void;
  onSelectRecord: (rec: BriefingRecord) => void;
}

// マークダウンからトップニュースセクションだけ抽出
function extractTopNews(text: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.match(/^##\s*(本日のトップ|今日のトップ|トップニュース)/));
  const end = lines.findIndex((l, i) => i > start && start >= 0 && l.startsWith("## "));
  if (start < 0) return lines.slice(0, 8).join("\n");
  const slice = end > start ? lines.slice(start, end) : lines.slice(start, start + 10);
  return slice.join("\n");
}

export default function MorningMode({ onHistoryUpdated, onSelectRecord }: Props) {
  const [selectedCats, setSelectedCats] = useState<string[]>([
    "AI・生成AI",
    "セキュリティ",
    "クラウド・インフラ",
  ]);
  const [level, setLevel] = useState<Level>("実務");
  const [jobs, setJobs] = useState<MorningJob[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  function toggleCat(label: string) {
    setSelectedCats((prev) =>
      prev.includes(label)
        ? prev.filter((c) => c !== label)
        : prev.length < 5
        ? [...prev, label]
        : prev
    );
  }

  async function generate() {
    if (selectedCats.length === 0 || running) return;
    setRunning(true);
    setExpandedCat(null);

    const initial: MorningJob[] = selectedCats.map((c) => ({
      category: c,
      jobId: null,
      status: "loading",
    }));
    setJobs(initial);

    // 各カテゴリを並列生成
    await Promise.allSettled(
      selectedCats.map(async (category, i) => {
        try {
          const jobId = await startJob("/api/briefing", { industry: category, level });
          setJobs((prev) =>
            prev.map((j, idx) => (idx === i ? { ...j, jobId } : j))
          );

          const data = await pollJob<{ text: string }>(
            "/api/briefing/status",
            jobId
          );
          const records = addBriefing({ industry: category, level, text: data.text });
          onHistoryUpdated();

          setJobs((prev) =>
            prev.map((j, idx) =>
              idx === i
                ? { ...j, status: "done", text: data.text, record: records[0] }
                : j
            )
          );
        } catch (e: any) {
          setJobs((prev) =>
            prev.map((j, idx) =>
              idx === i ? { ...j, status: "error", error: e.message } : j
            )
          );
        }
      })
    );

    setRunning(false);
  }

  return (
    <div className="space-y-6">
      {/* コントロール */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">
              カテゴリ選択（最大 5 件）
            </label>
            <span className="text-xs text-slate-400">
              {selectedCats.length} / 5 選択中
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TECH_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCat(c.label)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  selectedCats.includes(c.label)
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-slate-700 border-slate-300 hover:border-accent"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            レベル
          </label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  level === l
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={running || selectedCats.length === 0}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 transition"
        >
          {running
            ? `朝刊生成中… (${jobs.filter((j) => j.status === "done").length}/${jobs.length} 完了)`
            : "朝刊を生成する"}
        </button>
      </div>

      {/* カードグリッド */}
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <MorningCard
              key={job.category}
              job={job}
              expanded={expandedCat === job.category}
              onToggleExpand={() =>
                setExpandedCat(
                  expandedCat === job.category ? null : job.category
                )
              }
              onOpenFull={() => job.record && onSelectRecord(job.record)}
              extractTopNews={extractTopNews}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 text-sm">
          <p className="text-2xl mb-3">📰</p>
          <p>カテゴリを選んで「朝刊を生成する」を押してください</p>
          <p className="mt-1 text-xs">複数カテゴリを並列生成して一覧表示します</p>
        </div>
      )}
    </div>
  );
}

function MorningCard({
  job,
  expanded,
  onToggleExpand,
  onOpenFull,
  extractTopNews,
}: {
  job: MorningJob;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenFull: () => void;
  extractTopNews: (text: string) => string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
        job.status === "error" ? "border-red-200" : "border-slate-200"
      }`}
    >
      {/* カードヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-semibold text-slate-800">
          {job.category}
        </span>
        <div className="flex items-center gap-2">
          {job.status === "loading" && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-accent" />
          )}
          {job.status === "done" && (
            <>
              <button
                type="button"
                onClick={onToggleExpand}
                className="text-xs text-slate-500 hover:text-accent transition"
              >
                {expanded ? "折りたたむ" : "詳細"}
              </button>
              <button
                type="button"
                onClick={onOpenFull}
                className="text-xs bg-accent text-white rounded px-2 py-0.5 hover:bg-accent-hover transition"
              >
                全文
              </button>
            </>
          )}
          {job.status === "error" && (
            <span className="text-xs text-red-500">エラー</span>
          )}
        </div>
      </div>

      {/* カードボディ */}
      <div className="p-4">
        {job.status === "loading" && (
          <div className="space-y-2 py-2">
            <div className="h-3 bg-slate-100 rounded animate-pulse w-4/5" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-5/6" />
            <p className="text-xs text-slate-400 mt-3">Web検索中…</p>
          </div>
        )}
        {job.status === "error" && (
          <p className="text-sm text-red-600">{job.error}</p>
        )}
        {job.status === "done" && job.text && (
          <div className="text-sm">
            <Markdown>
              {expanded ? job.text : extractTopNews(job.text)}
            </Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
