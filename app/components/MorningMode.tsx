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

function extractTopNews(text: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.match(/^##\s*(本日のトップ|今日のトップ|トップニュース)/));
  const end = lines.findIndex((l, i) => i > start && start >= 0 && l.startsWith("## "));
  if (start < 0) return lines.slice(0, 10).join("\n");
  const slice = end > start ? lines.slice(start, end) : lines.slice(start, start + 12);
  return slice.join("\n");
}

export default function MorningMode({ onHistoryUpdated, onSelectRecord }: Props) {
  const [selectedCats, setSelectedCats] = useState<string[]>(["経営戦略・M&A", "AI・生成AI", "マクロ経済・金融"]);
  const [level, setLevel] = useState<Level>("エグゼクティブ");
  const [jobs, setJobs] = useState<MorningJob[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  function toggleCat(label: string) {
    setSelectedCats((prev) =>
      prev.includes(label)
        ? prev.filter((c) => c !== label)
        : prev.length < 5 ? [...prev, label] : prev
    );
  }

  async function generate() {
    if (selectedCats.length === 0 || running) return;
    setRunning(true); setExpandedCat(null);
    setJobs(selectedCats.map((c) => ({ category: c, jobId: null, status: "loading" })));

    await Promise.allSettled(
      selectedCats.map(async (category, i) => {
        try {
          const jobId = await startJob("/api/briefing", { industry: category, level });
          setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, jobId } : j));
          const data = await pollJob<{ text: string }>("/api/briefing/status", jobId);
          const records = addBriefing({ industry: category, level, text: data.text });
          onHistoryUpdated();
          setJobs((prev) => prev.map((j, idx) =>
            idx === i ? { ...j, status: "done", text: data.text, record: records[0] } : j
          ));
        } catch (e: any) {
          setJobs((prev) => prev.map((j, idx) =>
            idx === i ? { ...j, status: "error", error: e.message } : j
          ));
        }
      })
    );
    setRunning(false);
  }

  const doneCount = jobs.filter((j) => j.status === "done").length;

  return (
    <div className="space-y-4">
      {/* コントロールパネル */}
      <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
        <div className="bg-navy px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-0.5 h-3.5 bg-accent rounded-sm block" />
            <span className="text-2xs font-bold text-white uppercase tracking-widest">
              朝刊カテゴリ選択
            </span>
          </div>
          <span className="text-2xs text-navy-muted">{selectedCats.length}/5</span>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {TECH_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCat(c.label)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                  selectedCats.includes(c.label)
                    ? "bg-accent text-white border-accent"
                    : "bg-paper text-ink-mid border-paper-border hover:border-accent hover:text-accent"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-2xs text-ink-faint uppercase tracking-wider mr-1">レベル</span>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                    level === l
                      ? "bg-ink text-white border-ink"
                      : "bg-paper text-ink-muted border-paper-border hover:border-ink-mid"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={running || selectedCats.length === 0}
              className="ml-auto flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded px-4 py-2 transition-colors uppercase tracking-wide"
            >
              {running ? (
                <>
                  <span className="inline-block h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {doneCount}/{jobs.length} 完了
                </>
              ) : "朝刊を生成"}
            </button>
          </div>
        </div>
      </div>

      {/* カードグリッド */}
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {jobs.map((job) => (
            <MorningCard
              key={job.category}
              job={job}
              expanded={expandedCat === job.category}
              onToggle={() => setExpandedCat(expandedCat === job.category ? null : job.category)}
              onOpenFull={() => job.record && onSelectRecord(job.record)}
              extractTopNews={extractTopNews}
            />
          ))}
        </div>
      ) : (
        <div className="border border-paper-border border-dashed rounded-lg py-14 text-center">
          <p className="text-3xl opacity-30 mb-3">📰</p>
          <p className="text-sm text-ink-muted">
            カテゴリを選んで<strong>朝刊を生成</strong>してください
          </p>
          <p className="text-xs text-ink-faint mt-1">複数カテゴリを並列生成して一覧表示します</p>
        </div>
      )}
    </div>
  );
}

function MorningCard({
  job, expanded, onToggle, onOpenFull, extractTopNews,
}: {
  job: MorningJob;
  expanded: boolean;
  onToggle: () => void;
  onOpenFull: () => void;
  extractTopNews: (t: string) => string;
}) {
  return (
    <div className={`bg-paper-surface border rounded-lg overflow-hidden flex flex-col ${
      job.status === "error" ? "border-accent-border" : "border-paper-border"
    }`}>
      {/* カードヘッダー */}
      <div className="flex items-center gap-2 px-3 py-2 bg-navy/5 border-b border-paper-border">
        <span className="text-xs font-bold text-ink tracking-tight flex-1">{job.category}</span>
        {job.status === "loading" && (
          <span className="inline-block h-3 w-3 border-2 border-paper-border border-t-accent rounded-full animate-spin shrink-0" />
        )}
        {job.status === "done" && (
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggle}
              className="text-2xs text-ink-muted hover:text-ink transition-colors"
            >
              {expanded ? "折りたたむ ▲" : "詳細 ▼"}
            </button>
            <span className="text-paper-border">|</span>
            <button
              type="button"
              onClick={onOpenFull}
              className="text-2xs font-bold text-accent hover:text-accent-hover transition-colors"
            >
              全文 →
            </button>
          </div>
        )}
        {job.status === "error" && (
          <span className="text-2xs text-accent shrink-0">エラー</span>
        )}
      </div>

      {/* カードボディ */}
      <div className="p-3 flex-1">
        {job.status === "loading" && (
          <div className="space-y-2 py-1">
            <div className="skeleton h-2.5 w-4/5" />
            <div className="skeleton h-2.5 w-full" />
            <div className="skeleton h-2.5 w-11/12" />
            <div className="skeleton h-2.5 w-3/4 mt-3" />
            <div className="skeleton h-2.5 w-full" />
            <p className="text-2xs text-ink-faint mt-3">Web 検索中…</p>
          </div>
        )}
        {job.status === "error" && (
          <p className="text-xs text-accent">{job.error}</p>
        )}
        {job.status === "done" && job.text && (
          <div className="md-compact md">
            <Markdown>{expanded ? job.text : extractTopNews(job.text)}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
