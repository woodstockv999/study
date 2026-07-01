"use client";

import { useState } from "react";
import type { BriefingRecord } from "@/lib/storage";

interface Props {
  records: BriefingRecord[];
  activeId: string | null;
  onSelect: (rec: BriefingRecord) => void;
  onDelete: (id: string) => void;
}

type Filter = "all" | "starred";

function groupByDate(records: BriefingRecord[]): [string, BriefingRecord[]][] {
  const map = new Map<string, BriefingRecord[]>();
  for (const r of records) {
    const key = new Date(r.date).toLocaleDateString("ja-JP", {
      month: "numeric", day: "numeric",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries());
}

export default function HistorySidebar({ records, activeId, onSelect, onDelete }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "starred" ? records.filter((r) => r.starred) : records;
  const groups = groupByDate(filtered);

  return (
    <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-navy px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-0.5 h-3.5 bg-accent rounded-sm block" />
          <span className="text-2xs font-bold text-white uppercase tracking-widest">履歴</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-0.5 rounded text-2xs font-medium transition-colors ${
              filter === "all"
                ? "bg-white/20 text-white"
                : "text-navy-muted hover:text-white"
            }`}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => setFilter("starred")}
            className={`px-2 py-0.5 rounded text-2xs font-medium transition-colors ${
              filter === "starred"
                ? "bg-amber-400/20 text-amber-300"
                : "text-navy-muted hover:text-white"
            }`}
          >
            ★ スター
          </button>
        </div>
      </div>

      {/* 履歴リスト */}
      <div className="divide-y divide-paper-border max-h-[70vh] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-2xl mb-2 opacity-40">{filter === "starred" ? "★" : "🗂"}</p>
            <p className="text-xs text-ink-faint">
              {filter === "starred" ? "スター付きがありません" : "まだ履歴がありません"}
            </p>
          </div>
        ) : (
          groups.map(([date, recs]) => (
            <div key={date}>
              <div className="px-3 py-1 bg-paper border-b border-paper-border sticky top-0">
                <span className="text-2xs text-ink-faint font-bold uppercase tracking-wider">
                  {date}
                </span>
              </div>
              {recs.map((r) => (
                <div
                  key={r.id}
                  className={`group flex items-start gap-1.5 px-3 py-2.5 cursor-pointer transition-colors ${
                    activeId === r.id
                      ? "bg-navy/5 border-l-2 border-l-accent"
                      : "hover:bg-paper border-l-2 border-l-transparent"
                  }`}
                  onClick={() => onSelect(r)}
                >
                  {r.starred && (
                    <span className="text-amber-400 text-xs mt-0.5 shrink-0">★</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate leading-snug">
                      {r.industry}
                    </p>
                    <p className="text-2xs text-ink-faint mt-0.5">{r.level}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="削除"
                    onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                    className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-accent text-xs px-1 transition-all shrink-0 mt-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
