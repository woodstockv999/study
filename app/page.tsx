"use client";

import { useEffect, useRef, useState } from "react";
import IndustryPicker, { CUSTOM } from "./components/IndustryPicker";
import BriefingView from "./components/BriefingView";
import Quiz from "./components/Quiz";
import HistorySidebar from "./components/HistorySidebar";
import type { QuizQuestion } from "./api/quiz/route";
import { type Level } from "@/lib/prompts";
import { startJob, pollJob } from "@/lib/config";
import {
  addBriefing,
  deleteBriefing,
  loadHistory,
  loadSettings,
  saveSettings,
  type BriefingRecord,
} from "@/lib/storage";

const PENDING_JOB_KEY = "briefing.pending_job.v1";
interface PendingJob { jobId: string; industry: string; level: Level }

const QUIZ_PENDING_JOB_KEY = "quiz.pending_job.v1";
interface PendingQuizJob { jobId: string; briefingId: string }

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

  // 進行中のポーリングをキャンセルするための ref
  const pollAbortRef = useRef<AbortController | null>(null);
  const quizPollAbortRef = useRef<AbortController | null>(null);

  // 初期ロード（localStorage）
  useEffect(() => {
    const hist = loadHistory();
    setHistory(hist);
    const s = loadSettings();
    if (s) {
      setIndustry(s.industry);
      setCustomIndustry(s.customIndustry);
      setLevel(s.level);
    }

    const cleanups: Array<() => void> = [];

    // Safari を閉じた後に再開した際、処理中ジョブがあれば自動でポーリング再開
    const raw = localStorage.getItem(PENDING_JOB_KEY);
    if (raw) {
      let pending: PendingJob | null = null;
      try {
        pending = JSON.parse(raw);
      } catch {
        localStorage.removeItem(PENDING_JOB_KEY);
      }

      if (pending) {
        const p = pending;
        setIndustry(p.industry);
        setLevel(p.level);
        setLoading(true);

        const controller = new AbortController();
        pollAbortRef.current = controller;
        pollJob<{ text: string }>("/api/briefing/status", p.jobId, controller.signal)
          .then((data) => {
            localStorage.removeItem(PENDING_JOB_KEY);
            const next = addBriefing({ industry: p.industry, level: p.level, text: data.text });
            setHistory(next);
            setCurrent(next[0]);
          })
          .catch((e: any) => {
            if (e?.name === "AbortError") return;
            localStorage.removeItem(PENDING_JOB_KEY);
            setError(e.message);
          })
          .finally(() => setLoading(false));

        cleanups.push(() => controller.abort());
      }
    }

    // クイズ作成中に Safari を閉じた場合も同様に再開する
    const quizRaw = localStorage.getItem(QUIZ_PENDING_JOB_KEY);
    if (quizRaw) {
      let qPending: PendingQuizJob | null = null;
      try {
        qPending = JSON.parse(quizRaw);
      } catch {
        localStorage.removeItem(QUIZ_PENDING_JOB_KEY);
      }

      if (qPending) {
        const q = qPending;
        // クイズの対象だったブリーフィングを履歴から復元して表示
        const target = hist.find((r) => r.id === q.briefingId);
        if (target) setCurrent(target);
        setQuizLoading(true);

        const controller = new AbortController();
        quizPollAbortRef.current = controller;
        pollJob<{ questions: QuizQuestion[] }>("/api/quiz/status", q.jobId, controller.signal)
          .then((data) => {
            localStorage.removeItem(QUIZ_PENDING_JOB_KEY);
            setQuiz(data.questions);
          })
          .catch((e: any) => {
            if (e?.name === "AbortError") return;
            localStorage.removeItem(QUIZ_PENDING_JOB_KEY);
            setQuizError(e.message);
          })
          .finally(() => setQuizLoading(false));

        cleanups.push(() => controller.abort());
      }
    }

    return () => cleanups.forEach((fn) => fn());
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

    // 既存のポーリングをキャンセルしてから新規ジョブを開始
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;

    setLoading(true);
    setError("");
    setQuiz(null);
    setQuizError("");
    setCurrent(null);
    try {
      // サーバー側ジョブを起動（Safari を閉じても処理は継続）
      const jobId = await startJob("/api/briefing", { industry: ind, level });
      localStorage.setItem(PENDING_JOB_KEY, JSON.stringify({ jobId, industry: ind, level } satisfies PendingJob));

      // 3秒おきにステータスをポーリング
      const data = await pollJob<{ text: string }>("/api/briefing/status", jobId, controller.signal);
      localStorage.removeItem(PENDING_JOB_KEY);

      const next = addBriefing({ industry: ind, level, text: data.text });
      setHistory(next);
      setCurrent(next[0]);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      localStorage.removeItem(PENDING_JOB_KEY);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function startQuiz() {
    if (!current) return;

    // 既存のポーリングをキャンセルしてから新規ジョブを開始
    quizPollAbortRef.current?.abort();
    const controller = new AbortController();
    quizPollAbortRef.current = controller;

    setQuizLoading(true);
    setQuizError("");
    setQuiz(null);
    try {
      // サーバー側ジョブを起動（Safari を閉じても処理は継続）
      const jobId = await startJob("/api/quiz", { briefing: current.text });
      localStorage.setItem(
        QUIZ_PENDING_JOB_KEY,
        JSON.stringify({ jobId, briefingId: current.id } satisfies PendingQuizJob)
      );

      const data = await pollJob<{ questions: QuizQuestion[] }>(
        "/api/quiz/status",
        jobId,
        controller.signal
      );
      localStorage.removeItem(QUIZ_PENDING_JOB_KEY);
      setQuiz(data.questions);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      localStorage.removeItem(QUIZ_PENDING_JOB_KEY);
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={generate}
                className="shrink-0 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 transition"
              >
                再試行
              </button>
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
