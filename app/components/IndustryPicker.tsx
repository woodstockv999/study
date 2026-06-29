"use client";

import { TECH_CATEGORIES, LEVELS, type Level } from "@/lib/prompts";

export const CUSTOM = "__custom__";

interface Props {
  industry: string;
  customIndustry: string;
  level: Level;
  loading: boolean;
  onIndustryChange: (v: string) => void;
  onCustomChange: (v: string) => void;
  onLevelChange: (v: Level) => void;
  onGenerate: () => void;
}

export default function IndustryPicker({
  industry, customIndustry, level, loading,
  onIndustryChange, onCustomChange, onLevelChange, onGenerate,
}: Props) {
  const isCustom = industry === CUSTOM;

  return (
    <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
      {/* セクションヘッダー */}
      <div className="bg-navy px-4 py-2.5 flex items-center gap-2">
        <span className="w-0.5 h-3.5 bg-accent rounded-sm block" />
        <span className="text-2xs font-bold text-white uppercase tracking-widest">
          カテゴリ選択
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* カテゴリチップ */}
        <div>
          <div className="flex flex-wrap gap-1.5">
            {TECH_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onIndustryChange(c.label)}
                title={c.description}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                  industry === c.label
                    ? "bg-navy text-white border-navy"
                    : "bg-paper text-ink-mid border-paper-border hover:border-navy-mid hover:text-navy"
                }`}
              >
                {c.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onIndustryChange(CUSTOM)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                isCustom
                  ? "bg-navy text-white border-navy"
                  : "bg-paper text-ink-muted border-paper-border hover:border-navy-mid hover:text-navy"
              }`}
            >
              その他…
            </button>
          </div>
          {isCustom && (
            <input
              type="text"
              value={customIndustry}
              onChange={(e) => onCustomChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && onGenerate()}
              placeholder="例：ゲーム、フィンテック、農業テック…"
              className="mt-2 w-full border border-paper-border rounded px-3 py-1.5 text-sm bg-paper focus:border-navy-mid focus:ring-1 focus:ring-navy-mid outline-none"
            />
          )}
        </div>

        {/* レベル + 生成ボタン */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-2xs text-ink-faint uppercase tracking-wider mr-1">レベル</span>
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLevelChange(l)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                  level === l
                    ? "bg-ink text-white border-ink"
                    : "bg-paper text-ink-muted border-paper-border hover:border-ink-mid hover:text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded px-4 py-2 transition-colors uppercase tracking-wide"
          >
            {loading ? (
              <>
                <span className="inline-block h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                検索中
              </>
            ) : "生成"}
          </button>
        </div>
      </div>
    </div>
  );
}
