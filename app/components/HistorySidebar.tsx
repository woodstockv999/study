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
      month: "numeric",
      day: "numeric",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries());
}

export default function HistorySidebar({
  records,
  activeId,
  onSelect,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "starred" ? records.filter((r) => r.starred) : records;
  const groups = groupByDate(filtered);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">履歴</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-0.5 rounded text-xs transition ${
              filter === "all"
                ? "bg-slate-200 text-slate-700 font-medium"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => setFilter("starred")}
            className={`px-2 py-0.5 rounded text-xs transition ${
              filter === "starred"
                ? "bg-yellow-100 text-yellow-700 font-medium"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            ★ スター
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400">
          {filter === "starred"
            ? "スターを付けた記事がありません"
            : "まだありません。生成すると保存されます。"}
        </p>
      ) : (
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {groups.map(([date, recs]) => (
            <div key={date}>
              <p className="text-xs text-slate-400 font-medium mb-1 sticky top-0 bg-white py-0.5">
                {date}
              </p>
              <ul className="space-y-1">
                {recs.map((r) => (
                  <li
                    key={r.id}
                    className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer ${
                      activeId === r.id ? "bg-accent-soft" : "hover:bg-slate-50"
                    }`}
                  >
                    {r.starred && (
                      <span className="text-yellow-400 text-xs shrink-0">★</span>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelect(r)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="text-xs font-medium text-slate-800 truncate">
                        {r.industry}
                      </div>
                      <div className="text-xs text-slate-400">{r.level}</div>
                    </button>
                    <button
                      type="button"
                      aria-label="削除"
                      onClick={() => onDelete(r.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs px-1 transition"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
