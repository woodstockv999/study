"use client";

import { PRESET_INDUSTRIES, LEVELS, type Level } from "@/lib/prompts";

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

const CUSTOM = "__custom__";

export default function IndustryPicker({
  industry,
  customIndustry,
  level,
  loading,
  onIndustryChange,
  onCustomChange,
  onLevelChange,
  onGenerate,
}: Props) {
  const isCustom = industry === CUSTOM;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="space-y-4">
        {/* 業界 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            業界
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_INDUSTRIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onIndustryChange(p)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  industry === p
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-slate-700 border-slate-300 hover:border-accent"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onIndustryChange(CUSTOM)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                isCustom
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-slate-700 border-slate-300 hover:border-accent"
              }`}
            >
              その他（自由入力）
            </button>
          </div>
          {isCustom && (
            <input
              type="text"
              value={customIndustry}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="例：宇宙、農業、半導体製造装置 …"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            />
          )}
        </div>

        {/* レベル */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            レベル
          </label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLevelChange(l)}
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

        {/* 生成 */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 transition"
        >
          {loading ? "検索中…" : "ブリーフィングを生成"}
        </button>
      </div>
    </div>
  );
}

export { CUSTOM };
