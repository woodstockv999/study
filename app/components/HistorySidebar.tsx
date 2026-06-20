"use client";

import type { BriefingRecord } from "@/lib/storage";

interface Props {
  records: BriefingRecord[];
  activeId: string | null;
  onSelect: (rec: BriefingRecord) => void;
  onDelete: (id: string) => void;
}

export default function HistorySidebar({
  records,
  activeId,
  onSelect,
  onDelete,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">履歴</h2>
      {records.length === 0 ? (
        <p className="text-sm text-slate-400">
          まだありません。生成すると保存されます。
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {records.map((r) => (
            <li
              key={r.id}
              className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer ${
                activeId === r.id ? "bg-accent-soft" : "hover:bg-slate-50"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-sm font-medium text-slate-800 truncate">
                  {r.industry}
                </div>
                <div className="text-xs text-slate-500">
                  {r.level} ・{" "}
                  {new Date(r.date).toLocaleDateString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </div>
              </button>
              <button
                type="button"
                aria-label="削除"
                onClick={() => onDelete(r.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-sm px-1 transition"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
