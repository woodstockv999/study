"use client";

import { useState } from "react";
import type { QuizQuestion } from "../api/quiz/route";

export default function Quiz({
  questions,
  onClose,
}: {
  questions: QuizQuestion[];
  onClose: () => void;
}) {
  // 各問の選択（未回答は -1）
  const [choices, setChoices] = useState<number[]>(
    () => questions.map(() => -1)
  );
  const [graded, setGraded] = useState(false);

  const answeredAll = choices.every((c) => c >= 0);
  const score = questions.reduce(
    (acc, q, i) => acc + (choices[i] === q.answer ? 1 : 0),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">理解度チェック</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          閉じる
        </button>
      </div>

      <div className="space-y-5">
        {questions.map((q, qi) => (
          <div key={qi}>
            <p className="font-medium text-slate-800 mb-2">
              Q{qi + 1}. {q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = choices[qi] === oi;
                const isCorrect = q.answer === oi;
                let cls =
                  "border-slate-300 hover:border-accent bg-white text-slate-700";
                if (graded) {
                  if (isCorrect)
                    cls = "border-green-500 bg-green-50 text-green-800";
                  else if (selected)
                    cls = "border-red-400 bg-red-50 text-red-700";
                  else cls = "border-slate-200 bg-white text-slate-500";
                } else if (selected) {
                  cls = "border-accent bg-accent-soft text-slate-900";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={graded}
                    onClick={() =>
                      setChoices((prev) => {
                        const next = [...prev];
                        next[qi] = oi;
                        return next;
                      })
                    }
                    className={`w-full text-left text-sm rounded-lg border px-3 py-2 transition ${cls}`}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                );
              })}
            </div>
            {graded && (
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium">解説：</span>
                {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        {!graded ? (
          <button
            type="button"
            onClick={() => setGraded(true)}
            disabled={!answeredAll}
            className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2 transition"
          >
            採点する
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-slate-900">
              {score} / {questions.length} 正解
            </span>
            <button
              type="button"
              onClick={() => {
                setChoices(questions.map(() => -1));
                setGraded(false);
              }}
              className="text-sm text-accent hover:text-accent-hover"
            >
              もう一度
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
