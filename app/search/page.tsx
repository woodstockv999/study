"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { searchCompanies } from "@/lib/edinet";
import type { Company } from "@/lib/types";

const ALL = searchCompanies("");
const INDUSTRIES = [...new Set(ALL.map((c) => c.industry).filter(Boolean))] as string[];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");

  const results = useMemo<Company[]>(() => {
    let list = ALL;
    if (query.trim()) {
      const q = query.trim();
      list = list.filter((c) => c.filerName.includes(q) || (c.tickerCode ?? "").includes(q) || c.edinetCode.toLowerCase().includes(q.toLowerCase()));
    }
    if (industry) list = list.filter((c) => c.industry === industry);
    return list;
  }, [query, industry]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-0.5 h-4 bg-accent rounded-sm" />
          <h1 className="text-sm font-bold text-ink uppercase tracking-wide">企業検索</h1>
          <span className="text-xs text-ink-muted">({ALL.length}社)</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text" placeholder="企業名・銘柄コード・EDINETコード"
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm bg-paper-surface border border-paper-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-muted/30 text-ink placeholder:text-ink-faint"
          />
          <select
            value={industry} onChange={(e) => setIndustry(e.target.value)}
            className="px-3 py-2.5 text-sm bg-paper-surface border border-paper-border rounded-lg text-ink focus:outline-none sm:w-48"
          >
            <option value="">全業種</option>
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
      </div>
      <div>
        <p className="text-xs text-ink-muted mb-3">{results.length}件</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((c) => (
            <Link key={c.edinetCode} href={`/company/${c.edinetCode}`}
              className="group bg-paper-surface border border-paper-border rounded-lg p-4 hover:border-navy-muted/50 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-ink group-hover:text-navy-mid transition-colors leading-tight flex-1">{c.filerName}</p>
                {c.tickerCode && <span className="text-2xs font-mono bg-paper-dark text-ink-muted rounded px-1.5 py-0.5 shrink-0">{c.tickerCode}</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {c.industry && <span className="text-2xs bg-navy-surface text-navy-muted rounded-full px-2 py-0.5">{c.industry}</span>}
                {c.marketSegment && <span className="text-2xs bg-paper-dark text-ink-faint rounded-full px-2 py-0.5">{c.marketSegment}</span>}
                <span className="text-2xs text-ink-faint ml-auto font-mono">{c.edinetCode}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
