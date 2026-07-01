"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/",          label: "ニュース",   icon: "📰", desc: "業界ニュースの自動ブリーフィング", color: "#f59e0b" },
  { href: "/search",    label: "企業検索",   icon: "🔍", desc: "企業名・銘柄コードで開示情報を検索", color: "#3b82f6" },
  { href: "/compare",   label: "企業比較",   icon: "📊", desc: "複数企業の指標を並べて比較", color: "#22c55e" },
];

// page.tsx のタブ(URLハッシュ)と対応するパンくず表示名。"morning"はデフォルトなので表示しない。
const HASH_LABELS: Record<string, string> = {
  category: "テーマ深掘り",
  spotlight: "企業・業界リサーチ",
  weekly: "週次まとめ",
};

export default function Nav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === href : path.startsWith(href);

  const [subLabel, setSubLabel] = useState<string | null>(null);
  useEffect(() => {
    if (path !== "/") { setSubLabel(null); return; }
    const read = () => setSubLabel(HASH_LABELS[window.location.hash.slice(1)] ?? null);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [path]);

  return (
    <>
      <header className="bg-navy sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-2xs">
              <a href="/" className="text-navy-muted transition-colors hover:text-white/80" title="アプリ一覧へ戻る">
                🏠 ポータル
              </a>
              <span className="text-navy-muted/70">›</span>
              <span className={subLabel ? "text-navy-muted" : "text-white font-semibold"}>📰 PULSE</span>
              {subLabel && (
                <>
                  <span className="text-navy-muted/70">›</span>
                  <span className="text-white font-semibold">{subLabel}</span>
                </>
              )}
            </div>
            <span className="w-1 h-5 bg-accent rounded-sm" />
            <Link href="/" className="text-sm font-bold text-white tracking-tight">InfoHub</Link>
          </div>
          <span className="text-2xs text-navy-muted hidden sm:block">ニュース × EDINET</span>
        </div>
      </header>
      <div className="bg-navy max-w-6xl mx-auto px-4 pb-4 pt-1 flex flex-col gap-2">
        {LINKS.map((l) => {
          const isActive = active(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3.5 rounded-2xl border px-3.5 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                isActive
                  ? "border-accent/40 bg-accent/[0.07]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-px"
              }`}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ background: `color-mix(in srgb, ${l.color} 18%, transparent)` }}
              >
                {l.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{l.label}</span>
                <span className="block truncate text-xs text-navy-muted">{l.desc}</span>
              </span>
              {isActive ? (
                <span className="shrink-0 text-2xs font-semibold text-accent tracking-wide">現在地</span>
              ) : (
                <svg
                  className="shrink-0 text-navy-muted/60 transition-colors group-hover:text-navy-muted"
                  width="7" height="12" viewBox="0 0 7 12" fill="none"
                >
                  <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
