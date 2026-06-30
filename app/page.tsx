"use client";

import { useEffect, useRef, useState } from "react";
import IndustryPicker, { CUSTOM } from "./components/IndustryPicker";
import BriefingView from "./components/BriefingView";
import Quiz from "./components/Quiz";
import HistorySidebar from "./components/HistorySidebar";
import MorningMode from "./components/MorningMode";
import SpotlightMode from "./components/SpotlightMode";
import WeeklyMode from "./components/WeeklyMode";
import type { QuizQuestion } from "./api/quiz/route";
import { type Level } from "@/lib/prompts";
import { startJob, pollJob } from "@/lib/config";
import {
  addBriefing,
  deleteBriefing,
  loadHistory,
  loadSettings,
  saveSettings,
  toggleStar,
  type BriefingRecord,
} from "@/lib/storage";

type Tab = "morning" | "category" | "spotlight" | "weekly";

const PENDING_JOB_KEY = "briefing.pending_job.v1";
interface PendingJob { jobId: string; industry: string; level: Level }

const QUIZ_PENDING_JOB_KEY = "quiz.pending_job.v1";
interface PendingQuizJob { jobId: string; briefingId: string }

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: "morning",  label: "今日のブリーフ", short: "今日" },
  { id: "category", label: "テーマ深掘り",   short: "深掘り" },
  { id: "spotlight",label: "企業・業界リサーチ", short: "リサーチ" },
  { id: "weekly",   label: "週次まとめ",     short: "週次" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("morning");
  const [industry, setIndustry] = useState<string>("AI・生成AI");
  const [customIndustry, setCustomIndustry] = useState("");
  const [level, setLevel] = useState<Level>("エグゼクティブ");
  const [current, setCurrent] = useState<BriefingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizError, setQuizError] = useState("");
  const [history, setHistory] = useState<BriefingRecord[]>([]);

  const pollAbortRef = useRef<AbortController | null>(null);
  const quizPollAbortRef = useRef<AbortController | null>(null);

  function refreshHistory() { setHistory(loadHistory()); }

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

    const raw = localStorage.getItem(PENDING_JOB_KEY);
    if (raw) {
      let pending: PendingJob | null = null;
      try { pending = JSON.parse(raw); } catch { localStorage.removeItem(PENDING_JOB_KEY); }
      if (pending) {
        const p = pending;
        setTab("category"); setIndustry(p.industry); setLevel(p.level); setLoading(true);
        const controller = new AbortController();
        pollAbortRef.current = controller;
        pollJob<{ text: string }>("/api/briefing/status", p.jobId, controller.signal)
          .then((data) => {
            localStorage.removeItem(PENDING_JOB_KEY);
            const next = addBriefing({ industry: p.industry, level: p.level, text: data.text });
            setHistory(next); setCurrent(next[0]);
          })
          .catch((e: any) => { if (e?.name === "AbortError") return; localStorage.removeItem(PENDING_JOB_KEY); setError(e.message); })
          .finally(() => setLoading(false));
        cleanups.push(() => controller.abort());
      }
    }

    const quizRaw = localStorage.getItem(QUIZ_PENDING_JOB_KEY);
    if (quizRaw) {
      let qPending: PendingQuizJob | null = null;
      try { qPending = JSON.parse(quizRaw); } catch { localStorage.removeItem(QUIZ_PENDING_JOB_KEY); }
      if (qPending) {
        const q = qPending;
        const target = hist.find((r) => r.id === q.briefingId);
        if (target) { setTab("category"); setCurrent(target); }
        setQuizLoading(true);
        const controller = new AbortController();
        quizPollAbortRef.current = controller;
        pollJob<{ questions: QuizQuestion[] }>("/api/quiz/status", q.jobId, controller.signal)
          .then((data) => { localStorage.removeItem(QUIZ_PENDING_JOB_KEY); setQuiz(data.questions); })
          .catch((e: any) => { if (e?.name === "AbortError") return; localStorage.removeItem(QUIZ_PENDING_JOB_KEY); setQuizError(e.message); })
          .finally(() => setQuizLoading(false));
        cleanups.push(() => controller.abort());
      }
    }
    return () => cleanups.forEach((fn) => fn());
  }, []);

  useEffect(() => { saveSettings({ industry, customIndustry, level }); }, [industry, customIndustry, level]);

  function resolvedIndustry() { return industry === CUSTOM ? customIndustry.trim() : industry; }

  async function generate() {
    const ind = resolvedIndustry();
    if (!ind) { setError("カテゴリを選択または入力してください。"); return; }
    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;
    setLoading(true); setError(""); setQuiz(null); setQuizError(""); setCurrent(null);
    try {
      const jobId = await startJob("/api/briefing", { industry: ind, level });
      localStorage.setItem(PENDING_JOB_KEY, JSON.stringify({ jobId, industry: ind, level } satisfies PendingJob));
      const data = await pollJob<{ text: string }>("/api/briefing/status", jobId, controller.signal);
      localStorage.removeItem(PENDING_JOB_KEY);
      const next = addBriefing({ industry: ind, level, text: data.text });
      setHistory(next); setCurrent(next[0]);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      localStorage.removeItem(PENDING_JOB_KEY); setError(e.message);
    } finally { setLoading(false); }
  }

  async function startQuiz() {
    if (!current) return;
    quizPollAbortRef.current?.abort();
    const controller = new AbortController();
    quizPollAbortRef.current = controller;
    setQuizLoading(true); setQuizError(""); setQuiz(null);
    try {
      const jobId = await startJob("/api/quiz", { briefing: current.text });
      localStorage.setItem(QUIZ_PENDING_JOB_KEY, JSON.stringify({ jobId, briefingId: current.id } satisfies PendingQuizJob));
      const data = await pollJob<{ questions: QuizQuestion[] }>("/api/quiz/status", jobId, controller.signal);
      localStorage.removeItem(QUIZ_PENDING_JOB_KEY); setQuiz(data.questions);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      localStorage.removeItem(QUIZ_PENDING_JOB_KEY); setQuizError(e.message);
    } finally { setQuizLoading(false); }
  }

  function handleToggleStar() {
    if (!current) return;
    const next = toggleStar(current.id);
    setHistory(next);
    const updated = next.find((r) => r.id === current.id);
    if (updated) setCurrent(updated);
  }

  function selectHistory(rec: BriefingRecord) {
    setCurrent(rec); setQuiz(null); setQuizError(""); setError(""); setTab("category");
  }

  function removeHistory(id: string) {
    const next = deleteBriefing(id);
    setHistory(next);
    if (current?.id === id) setCurrent(null);
  }

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  return (
    <div className="min-h-screen bg-paper font-sans">
      {/* ─── ヘッダー + タブナビ（ダークネイビー） ─── */}
      <div className="bg-navy sticky top-0 z-20">
        {/* ロゴ行 */}
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="shrink-0 text-2xs text-navy-muted transition-colors hover:text-white/80"
            >
              ← ポータルへ
            </a>
            <span className="w-1 h-5 bg-accent rounded-sm block" />
            <h1 className="text-sm font-bold text-white tracking-tight">
              コンサルタント ブリーフィング
            </h1>
          </div>
          <span className="text-2xs text-navy-muted hidden sm:block tabular-nums">
            {today}
          </span>
        </div>
        {/* タブ行 */}
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 px-4 py-2.5 text-xs font-medium tracking-wide uppercase transition-colors ${
                tab === t.id
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-t"
                  : "text-navy-muted hover:text-white/80"
              }`}
            >
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── メインコンテンツ ─── */}
      <main className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
        <div className="min-w-0 space-y-5">

          {tab === "morning" && (
            <MorningMode
              onHistoryUpdated={refreshHistory}
              onSelectRecord={(rec) => { setCurrent(rec); setQuiz(null); setTab("category"); }}
            />
          )}

          {tab === "category" && (
            <>
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
                <div className="border border-accent-border bg-accent-soft rounded-lg px-4 py-3 text-sm text-accent flex items-center justify-between gap-3">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={generate}
                    className="shrink-0 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded px-3 py-1.5 transition"
                  >
                    再試行
                  </button>
                </div>
              )}

              {loading && <LoadingSkeleton />}

              {current && !loading && (
                <BriefingView
                  record={current}
                  onStartQuiz={startQuiz}
                  quizLoading={quizLoading}
                  onToggleStar={handleToggleStar}
                />
              )}

              {quizError && (
                <div className="border border-accent-border bg-accent-soft rounded-lg px-4 py-3 text-sm text-accent">
                  {quizError}
                </div>
              )}

              {quiz && <Quiz questions={quiz} onClose={() => setQuiz(null)} />}

              {!current && !loading && !error && <EmptyState />}
            </>
          )}

          {tab === "spotlight" && <SpotlightMode onHistoryUpdated={refreshHistory} />}
          {tab === "weekly" && <WeeklyMode onHistoryUpdated={refreshHistory} />}
        </div>

        <aside className="lg:sticky lg:top-[88px] self-start">
          <HistorySidebar
            records={history}
            activeId={current?.id ?? null}
            onSelect={selectHistory}
            onDelete={removeHistory}
          />
        </aside>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 border-t border-paper-border mt-4">
        <p className="text-2xs text-ink-faint text-center tracking-wide">
          個人用ツール — 履歴はこのブラウザの localStorage にのみ保存されます
        </p>
      </footer>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-paper-surface border border-paper-border rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-12" />
      </div>
      <div className="skeleton h-4 w-2/3" />
      <div className="space-y-2 pt-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-11/12" />
        <div className="skeleton h-3 w-4/5" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-10/12" />
      </div>
      <p className="text-xs text-ink-faint pt-1">Web 検索中…数十秒かかることがあります</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-paper-border border-dashed rounded-lg py-16 text-center">
      <p className="text-3xl mb-3 opacity-40">📰</p>
      <p className="text-sm text-ink-muted">カテゴリとレベルを選んで生成してください</p>
    </div>
  );
}
