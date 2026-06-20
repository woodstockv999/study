"use client";

import { useEffect, useState } from "react";
import IndustryPicker, { CUSTOM } from "./components/IndustryPicker";
import BriefingView from "./components/BriefingView";
import Quiz from "./components/Quiz";
import HistorySidebar from "./components/HistorySidebar";
import type { QuizQuestion } from "./api/quiz/route";
import { type Level } from "@/lib/prompts";
import {
  addBriefing,
  deleteBriefing,
  loadHistory,
  loadSettings,
  saveSettings,
  type BriefingRecord,
} from "@/lib/storage";

export default function Home() {
  // 選択状態
  const [industry, setIndustry] = useState<string>("IT・ソフトウェア");
  const [customIndustry, setCustomIndustry] = useState("");
  const [level, setLevel] = useState<Level>("実務");

  // 表示中ブリーフィング
  const [current, setCurrent] = useState<BriefingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // クイズ
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizError, setQuizError] = useState("");

  // 履歴
  const [history, setHistory] = useState<BriefingRecord[]>([]);

  // 初期ロード（localStorage）
  useEffect(() => {
    setHistory(loadHistory());
    const s = loadSettings();
    if (s) {
      setIndustry(s.industry);
      setCustomIndustry(s.customIndustry);
      setLevel(s.level);
    }
  }, []);

  // 設定の永続化
  useEffect(() => {
    saveSettings({ industry, customIndustry, level });
  }, [industry, customIndustry, level]);

  function resolvedIndustry(): string {
    return industry === CUSTOM ? customIndustry.trim() : industry;
  }

  async function generate() {
    const ind = resolvedIndustry();
    if (!ind) {
      setError("業界を選択または入力してください。");
      return;
    }
    setLoading(true);
    setError("");
    setQuiz(null);
    setQuizError("");
    setCurrent(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: ind, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました。");

      const next = addBriefing({ industry: ind, level, text: data.text });
      setHistory(next);
      setCurrent(next[0]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function startQuiz() {
    if (!current) return;
    setQuizLoading(true);
    setQuizError("");
    setQuiz(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefing: current.text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "クイズ生成に失敗しました。");
      setQuiz(data.questions);
    } catch (e: any) {
      setQuizError(e.message);
    } finally {
      setQuizLoading(false);
    }
  }

  function selectHistory(rec: BriefingRecord) {
    setCurrent(rec);
    setQuiz(null);
    setQuizError("");
    setError("");
  }

  function removeHistory(id: string) {
    const next = deleteBriefing(id);
    setHistory(next);
    if (current?.id === id) setCurrent(null);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            業界ブリーフィング Bot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            担当業界のトレンド・用語・論点を、毎日5分でキャッチアップ
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* 左：メインカラム */}
        <div className="space-y-6 min-w-0">
          <IndustryPicker
            industry={industry}
            customIndustry={customIndustry}
            level={level}
            loading={loading}
            onIndustryChange={setIndustry}
            onCustomChange={setCustomIndustry}
            onLevelChange={setLevel}
            onGenerate={generate}
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-accent" />
              <p className="mt-3 text-sm text-slate-600">
                Web 検索中…（数十秒かかることがあります）
              </p>
            </div>
          )}

          {current && !loading && (
            <BriefingView
              industry={current.industry}
              level={current.level}
              date={current.date}
              text={current.text}
              onStartQuiz={startQuiz}
              quizLoading={quizLoading}
            />
          )}

          {quizError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {quizError}
            </div>
          )}

          {quiz && (
            <Quiz questions={quiz} onClose={() => setQuiz(null)} />
          )}
        </div>

        {/* 右：履歴（モバイルでは下に回り込む） */}
        <aside className="lg:sticky lg:top-6 self-start">
          <HistorySidebar
            records={history}
            activeId={current?.id ?? null}
            onSelect={selectHistory}
            onDelete={removeHistory}
          />
        </aside>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-slate-400">
        個人用ツール ・ 履歴はこの端末のブラウザ（localStorage）にのみ保存されます
      </footer>
    </div>
  );
}
