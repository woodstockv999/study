import { getRssItems } from "@/lib/rss";
import { getFilings, getBulkReports, getDashboardStats } from "@/lib/edinet";
import { formatPubDate, formatSubmitDate } from "@/lib/format";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import FilingRow from "@/components/FilingRow";
import Link from "next/link";
import type { RssItem, BulkReport } from "@/lib/types";
import NewsRefreshButton from "./components/NewsRefreshButton";

export const revalidate = 0;

const TAG_COLOR: Record<string, string> = {
  経済: "bg-navy-surface text-navy-muted", テック: "bg-paper-dark text-ink-mid",
  AI: "bg-accent-soft text-accent", 政治: "bg-paper-dark text-ink-mid",
  国際: "bg-paper-dark text-ink-mid", 社会: "bg-paper-dark text-ink-mid",
  マーケット: "bg-pos-soft text-pos", 企業: "bg-paper-dark text-ink-mid",
};

export default async function NewsPage() {
  const [rss, filings, bulkReports, stats] = await Promise.all([
    getRssItems().catch(() => ({ items: [] as RssItem[], fetchedAt: new Date().toISOString() })),
    getFilings(new Date().toISOString().slice(0, 10)).catch(() => []),
    getBulkReports().catch(() => []),
    getDashboardStats().catch(() => null),
  ]);

  const hasSummaries = rss.items.some((i) => i.summary);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* ニュース */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-0.5 h-4 bg-accent rounded-sm" />
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">最新ニュース</h2>
              {rss.fetchedAt && <p className="text-xs text-ink-muted">取得: {formatPubDate(rss.fetchedAt)}</p>}
            </div>
          </div>
          <NewsRefreshButton hasSummaries={hasSummaries} />
        </div>

        {rss.items.length === 0 ? (
          <p className="text-center py-12 text-ink-muted text-sm">RSSを読み込めませんでした。「更新」で再試行。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rss.items.slice(0, 18).map((item) => <NewsCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      {/* EDINET */}
      {stats && (
        <div>
          <SectionHeader title="本日の開示状況" sub={stats.date} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="総開示件数" value={stats.totalFilings.toLocaleString()} sub="本日" />
            <StatCard label="有価証券報告書" value={stats.annualReports} sub="年次決算" />
            <StatCard label="四半期報告書" value={stats.quarterlyReports} sub="四半期" />
            <StatCard label="大量保有報告書" value={stats.bulkReports} sub="5%ルール" accent />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
              <div className="bg-navy px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="w-0.5 h-4 bg-accent rounded-sm" /><span className="text-xs font-bold text-white uppercase tracking-wider">最新開示書類</span></div>
                <Link href="/search" className="text-2xs text-navy-muted hover:text-white transition-colors">企業検索 →</Link>
              </div>
              <div className="divide-y divide-paper-border px-3">
                {filings.slice(0, 8).map((f) => <FilingRow key={f.docID} filing={f} />)}
              </div>
            </div>
            <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
              <div className="bg-navy px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="w-0.5 h-4 bg-accent rounded-sm" /><span className="text-xs font-bold text-white uppercase tracking-wider">大量保有</span></div>
                <Link href="/bulk" className="text-2xs text-navy-muted hover:text-white transition-colors">全件 →</Link>
              </div>
              <div className="divide-y divide-paper-border">
                {bulkReports.slice(0, 6).map((r) => <BulkRow key={r.docID} report={r} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: RssItem }) {
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      className="group bg-paper-surface border border-paper-border rounded-lg p-4 hover:border-navy-muted/50 hover:shadow-md transition-all flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs text-ink-faint">{item.source}</span>
        <span className="text-2xs text-ink-faint tabular-nums">{formatPubDate(item.pubDate)}</span>
      </div>
      <p className="text-sm font-semibold text-ink group-hover:text-navy-mid transition-colors leading-snug line-clamp-3">{item.title}</p>
      {item.summary
        ? <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">{item.summary}</p>
        : <p className="text-xs text-ink-faint leading-relaxed line-clamp-2">{item.description}</p>
      }
      <div className="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
        {item.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className={`text-2xs rounded-full px-2 py-0.5 font-medium ${TAG_COLOR[tag] ?? "bg-paper-dark text-ink-mid"}`}>{tag}</span>
        ))}
        {(item.importance ?? 0) >= 4 && <span className="ml-auto text-2xs bg-accent text-white rounded-full px-2 py-0.5 font-bold">速報</span>}
      </div>
    </a>
  );
}

function BulkRow({ report }: { report: BulkReport }) {
  const isUp = report.changeType === "新規" || report.changeType === "増加";
  const isDown = report.changeType === "減少";
  return (
    <div className="px-4 py-3 hover:bg-paper transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink truncate">{report.targetCompany}</p>
          <p className="text-2xs text-ink-muted truncate">{report.reporterName}</p>
        </div>
        <p className={`text-sm font-bold tabular-nums shrink-0 ${isUp ? "text-pos" : isDown ? "text-neg" : "text-ink-muted"}`}>
          {report.changeType === "増加" ? "▲" : report.changeType === "減少" ? "▼" : ""}{report.holdingRate.toFixed(2)}%
        </p>
      </div>
      <p className="text-2xs text-ink-faint mt-0.5">{formatSubmitDate(report.submitDateTime)}</p>
    </div>
  );
}
