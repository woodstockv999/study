"use client";

import { useState } from "react";
import type { QuizQuestion } from "../api/quiz/route";

export default function Quiz({ questions, onClose }: { questions: QuizQuestion[]; onClose: () => void }) {
  const [choices, setChoices] = useState<number[]>(() => questions.map(() => -1));
  const [graded, setGraded] = useState(false);

  const answeredAll = choices.every((c) => c >= 0);
  const score = questions.reduce((acc, q, i) => acc + (choices[i] === q.answer ? 1 : 0), 0);

  return (
    <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-navy px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-0.5 h-3.5 bg-accent rounded-sm block" />
          <span className="text-2xs font-bold text-white uppercase tracking-widest">理解度チェック</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-2xs text-navy-muted hover:text-white transition-colors"
        >
          閉じる ✕
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-6">
        {questions.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm font-semibold text-ink mb-3">
              <span className="text-accent font-bold mr-1.5">Q{qi + 1}.</span>
              {q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = choices[qi] === oi;
                const isCorrect = q.answer === oi;
                let cls = "border-paper-border bg-paper text-ink-mid hover:border-ink-mid hover:text-ink";
                if (graded) {
                  if (isCorrect) cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
                  else if (selected) cls = "border-accent-border bg-accent-soft text-accent";
                  else cls = "border-paper-border bg-paper text-ink-faint";
                } else if (selected) {
                  cls = "border-navy bg-navy/5 text-ink font-medium";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={graded}
                    onClick={() => setChoices((prev) => { const next = [...prev]; next[qi] = oi; return next; })}
                    className={`w-full text-left text-xs rounded border px-3 py-2 transition-colors ${cls}`}
                  >
                    <span className="font-bold mr-2 text-ink-faint">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {graded && (
              <div className="mt-2 text-xs text-ink-mid bg-paper border-l-2 border-l-accent pl-3 py-1.5">
                <span className="font-bold text-accent">解説: </span>{q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* フッター */}
      <div className="border-t border-paper-border px-4 py-3 bg-paper flex items-center gap-4">
        {!graded ? (
          <button
            type="button"
            onClick={() => setGraded(true)}
            disabled={!answeredAll}
            className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-xs font-bold rounded px-4 py-2 transition-colors uppercase tracking-wide"
          >
            採点する
          </button>
        ) : (
          <>
            <span className="text-sm font-bold text-ink">
              <span className={score === questions.length ? "text-emerald-600" : "text-accent"}>
                {score}
              </span>
              <span className="text-ink-muted"> / {questions.length} 正解</span>
            </span>
            <button
              type="button"
              onClick={() => { setChoices(questions.map(() => -1)); setGraded(false); }}
              className="text-xs text-ink-muted hover:text-ink border border-paper-border rounded px-3 py-1.5 hover:border-ink-mid transition-colors"
            >
              もう一度
            </button>
          </>
        )}
      </div>
    </div>
  );
}
