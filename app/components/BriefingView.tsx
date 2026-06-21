"use client";

import { useState } from "react";
import Markdown from "./Markdown";
import type { Level } from "@/lib/prompts";
import { postStream } from "@/lib/config";

interface Props {
  industry: string;
  level: Level;
  date: string;
  text: string;
  onStartQuiz: () => void;
  quizLoading: boolean;
}

export default function BriefingView({
  industry,
  level,
  date,
  text,
  onStartQuiz,
  quizLoading,
}: Props) {
  const [term, setTerm] = useState("");
  const [deepResult, setDeepResult] = useState("");
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepError, setDeepError] = useState("");

  async function runDeepdive() {
    const t = term.trim();
    if (!t) return;
    setDeepLoading(true);
    setDeepError("");
    setDeepResult("");
    try {
      const data = await postStream<{ text: string }>("/api/deepdive", {
        term: t,
        industry,
      });
      setDeepResult(data.text);
    } catch (e: any) {
      setDeepError(e.message);
    } finally {
      setDeepLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
        <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent font-medium">
          {industry}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-100">{level}</span>
        <span>{new Date(date).toLocaleString("ja-JP")}</span>
      </div>

      <Markdown>{text}</Markdown>

      {/* クイズ起動 */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onStartQuiz}
          disabled={quizLoading}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
        >
          {quizLoading ? "作成中…" : "クイズに挑戦"}
        </button>
      </div>

      {/* 用語の深掘り */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          用語の深掘り
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runDeepdive()}
            placeholder="気になるキーワードを入力"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
          />
          <button
            type="button"
            onClick={runDeepdive}
            disabled={deepLoading || !term.trim()}
            className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap transition"
          >
            {deepLoading ? "…" : "深掘り"}
          </button>
        </div>
        {deepError && (
          <p className="mt-2 text-sm text-red-600">{deepError}</p>
        )}
        {deepResult && (
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
            <Markdown>{deepResult}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
