import { getRssItems } from "@/lib/rss";
import { getFilings, getDashboardStats } from "@/lib/edinet";
import { formatPubDate } from "@/lib/format";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import FilingRow from "@/components/FilingRow";
import Link from "next/link";
import type { RssItem } from "@/lib/types";
import NewsRefreshButton from "./components/NewsRefreshButton";

export const revalidate = 0;

const SOURCE_LABEL: Record<string, string> = {
  "NHK経済": "経済",
  "NHK社会": "社会",
  "NHK国際": "国際",
  "ITmedia": "テック",
  "GIGAZINE": "テック",
  "Reuters": "ビジネス",
};

export default async function NewsPage() {
  const [rss, filings, stats] = await Promise.all([
    getRssItems().catch(() => ({ items: [] as RssItem[], fetchedAt: new Date().toISOString() })),
    getFilings(new Date().toISOString().slice(0, 10)).catch(() => []),
    getDashboardStats().catch(() => null),
  ]);

  const hasSummaries = rss.items.some((i) => i.summary);

  // ソース別にグループ化
  const bySource = new Map<string, RssItem[]>();
  for (const item of rss.items) {
    const list = bySource.get(item.source) ?? [];
    list.push(item);
    bySource.set(item.source, list);
  }
  const sources = Array.from(bySource.entries());

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* ニュース */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-0.5 h-4 bg-accent rounded-sm" />
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">カテゴリ別最新ニュース</h2>
              {rss.fetchedAt && <p className="text-xs text-ink-muted">取得: {formatPubDate(rss.fetchedAt)}</p>}
            </div>
          </div>
          <NewsRefreshButton hasSummaries={hasSummaries} />
        </div>

        {sources.length === 0 ? (
          <p className="text-center py-12 text-ink-muted text-sm">RSSを読み込めませんでした。「更新」で再試行。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map(([source, items]) => (
              <CategorySection key={source} source={source} items={items} />
            ))}
          </div>
        )}
      </div>

      {/* EDINET */}
      {stats && (
        <div>
          <SectionHeader title="本日の開示状況" sub={stats.date} />
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="総開示件数" value={stats.totalFilings.toLocaleString()} sub="本日" />
            <StatCard label="有価証券報告書" value={stats.annualReports} sub="年次決算" />
            <StatCard label="四半期報告書" value={stats.quarterlyReports} sub="四半期" />
          </div>
          <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
            <div className="bg-navy px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="w-0.5 h-4 bg-accent rounded-sm" /><span className="text-xs font-bold text-white uppercase tracking-wider">最新開示書類</span></div>
              <Link href="/search" className="text-2xs text-navy-muted hover:text-white transition-colors">企業検索 →</Link>
            </div>
            <div className="divide-y divide-paper-border px-3">
              {filings.slice(0, 8).map((f) => <FilingRow key={f.docID} filing={f} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({ source, items }: { source: string; items: RssItem[] }) {
  const label = SOURCE_LABEL[source] ?? source;
  return (
    <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
      <div className="bg-navy px-3 py-2.5 flex items-center gap-2">
        <span className="w-0.5 h-3.5 bg-accent rounded-sm" />
        <span className="text-xs font-bold text-white tracking-wide">{source}</span>
        <span className="ml-auto text-2xs text-navy-muted bg-navy-surface px-1.5 py-0.5 rounded">{label}</span>
      </div>
      <div className="divide-y divide-paper-border">
        {items.slice(0, 6).map((item) => <NewsRow key={item.id} item={item} />)}
      </div>
    </div>
  );
}

function NewsRow({ item }: { item: RssItem }) {
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col gap-1 px-3 py-2.5 hover:bg-paper transition-colors">
      <p className="text-xs font-medium text-ink group-hover:text-navy-mid transition-colors leading-snug line-clamp-2">
        {item.title}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-2xs text-ink-faint tabular-nums">{formatPubDate(item.pubDate)}</span>
        {(item.importance ?? 0) >= 4 && (
          <span className="text-2xs bg-accent text-white rounded-full px-1.5 py-0.5 font-bold leading-none">速報</span>
        )}
      </div>
    </a>
  );
}
