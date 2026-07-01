"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/",          label: "ニュース" },
  { href: "/search",    label: "企業検索" },
  { href: "/compare",   label: "企業比較" },
];

export default function Nav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === href : path.startsWith(href);

  return (
    <header className="bg-navy sticky top-0 z-30 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-2xs">
            <a href="/" className="text-navy-muted transition-colors hover:text-white/80" title="アプリ一覧へ戻る">
              🏠 ポータル
            </a>
            <span className="text-navy-muted/70">›</span>
            <span className="text-white font-semibold">📰 PULSE</span>
          </div>
          <span className="w-1 h-5 bg-accent rounded-sm" />
          <Link href="/" className="text-sm font-bold text-white tracking-tight">InfoHub</Link>
        </div>
        <span className="text-2xs text-navy-muted hidden sm:block">ニュース × EDINET</span>
      </div>
      <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`relative shrink-0 px-4 py-2.5 text-xs font-medium tracking-wide uppercase transition-colors ${
              active(l.href)
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-t"
                : "text-navy-muted hover:text-white/80"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
