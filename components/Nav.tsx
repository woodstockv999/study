"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/",          label: "ニュース",   icon: "📰", desc: "業界ニュースの自動ブリーフィング" },
  { href: "/search",    label: "企業検索",   icon: "🔍", desc: "企業名・銘柄コードで開示情報を検索" },
  { href: "/compare",   label: "企業比較",   icon: "📊", desc: "複数企業の指標を並べて比較" },
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
    <header className="bg-navy sticky top-0 z-30 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between">
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
      <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            title={l.desc}
            className={`shrink-0 flex items-center gap-2 rounded-xl border px-3.5 py-2 transition-colors ${
              active(l.href)
                ? "border-accent bg-accent/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
            }`}
          >
            <span className="text-base leading-none">{l.icon}</span>
            <span className="flex flex-col">
              <span className={`text-xs font-semibold tracking-wide ${active(l.href) ? "text-white" : "text-navy-muted"}`}>
                {l.label}
              </span>
              <span className="hidden sm:block text-[0.65rem] leading-tight text-navy-muted/80">
                {l.desc}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </header>
  );
}
