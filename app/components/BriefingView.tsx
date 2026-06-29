"use client";

import { useState } from "react";
import Markdown from "./Markdown";
import { postStream } from "@/lib/config";
import type { BriefingRecord } from "@/lib/storage";

interface Props {
  record: BriefingRecord;
  onStartQuiz: () => void;
  quizLoading: boolean;
  onToggleStar: () => void;
}

export default function BriefingView({ record, onStartQuiz, quizLoading, onToggleStar }: Props) {
  const { industry, level, date, text, starred } = record;
  const [term, setTerm] = useState("");
  const [deepResult, setDeepResult] = useState("");
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepError, setDeepError] = useState("");

  async function runDeepdive() {
    const t = term.trim();
    if (!t) return;
    setDeepLoading(true); setDeepError(""); setDeepResult("");
    try {
      const data = await postStream<{ text: string }>("/api/deepdive", { term: t, industry });
      setDeepResult(data.text);
    } catch (e: any) {
      setDeepError(e.message);
    } finally {
      setDeepLoading(false);
    }
  }

  const dateStr = new Date(date).toLocaleString("ja-JP", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <article className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
      {/* 記事ヘッダー */}
      <div className="border-b border-paper-border px-4 py-3 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-navy text-white text-2xs font-bold uppercase tracking-wider shrink-0">
            {industry}
          </span>
          <span className="text-2xs text-ink-faint border border-paper-border rounded px-1.5 py-0.5 shrink-0">
            {level}
          </span>
          <span className="text-2xs text-ink-faint tabular-nums ml-auto shrink-0">{dateStr}</span>
        </div>
        <button
          type="button"
          onClick={onToggleStar}
          aria-label={starred ? "スターを外す" : "スターを付ける"}
          className={`text-lg leading-none transition-colors shrink-0 ${
            starred ? "text-amber-400" : "text-paper-border hover:text-amber-300"
          }`}
        >
          {starred ? "★" : "☆"}
        </button>
      </div>

      {/* 記事本文 */}
      <div className="px-4 sm:px-5 py-4">
        <Markdown>{text}</Markdown>
      </div>

      {/* アクション行 */}
      <div className="border-t border-paper-border px-4 py-3 bg-paper flex items-center gap-3">
        <button
          type="button"
          onClick={onStartQuiz}
          disabled={quizLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-ink-mid border border-paper-border hover:border-ink-mid hover:text-ink rounded px-3 py-1.5 disabled:opacity-50 transition-colors bg-paper-surface uppercase tracking-wide"
        >
          {quizLoading ? (
            <>
              <span className="inline-block h-3 w-3 border-2 border-ink-faint border-t-ink-mid rounded-full animate-spin" />
              作成中
            </>
          ) : "理解度クイズ"}
        </button>
      </div>

      {/* 深掘り */}
      <div className="border-t border-paper-border px-4 py-3 space-y-2">
        <p className="text-2xs text-ink-faint uppercase tracking-wider font-bold">キーワード深掘り</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runDeepdive()}
            placeholder="気になる用語を入力して Enter"
            className="flex-1 border border-paper-border rounded px-3 py-1.5 text-sm bg-paper focus:border-navy-mid focus:ring-1 focus:ring-navy-mid outline-none"
          />
          <button
            type="button"
            onClick={runDeepdive}
            disabled={deepLoading || !term.trim()}
            className="bg-navy hover:bg-navy-mid disabled:opacity-40 text-white text-xs font-bold rounded px-3 py-1.5 whitespace-nowrap transition-colors"
          >
            {deepLoading ? "…" : "深掘り"}
          </button>
        </div>
        {deepError && <p className="text-xs text-accent">{deepError}</p>}
        {deepResult && (
          <div className="mt-2 rounded bg-paper border border-paper-border p-3">
            <Markdown>{deepResult}</Markdown>
          </div>
        )}
      </div>
    </article>
  );
}
