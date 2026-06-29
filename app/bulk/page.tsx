import { getBulkReports } from "@/lib/edinet";
import { formatSubmitDate, formatShares } from "@/lib/format";
import SectionHeader from "@/components/SectionHeader";
import type { BulkReport } from "@/lib/types";

export const revalidate = 300;

const CS: Record<BulkReport["changeType"], { badge: string; text: string; arrow: string }> = {
  新規: { badge: "bg-pos text-white",                              text: "text-pos",     arrow: "NEW" },
  増加: { badge: "bg-pos/20 text-pos border border-pos/30",        text: "text-pos",     arrow: "▲" },
  減少: { badge: "bg-neg/20 text-neg border border-neg/30",        text: "text-neg",     arrow: "▼" },
  変更: { badge: "bg-ink-faint/20 text-ink-mid border border-paper-border", text: "text-ink-muted", arrow: "→" },
};

export default async function BulkPage() {
  const reports = await getBulkReports();
  const newCount = reports.filter((r) => r.changeType === "新規").length;
  const upCount  = reports.filter((r) => r.changeType === "増加").length;
  const downCount = reports.filter((r) => r.changeType === "減少").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <SectionHeader title="大量保有報告書" sub="5%ルール — 大量保有者の開示義務" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-paper-surface border border-paper-border rounded-lg p-3 text-center">
            <p className="text-2xs text-ink-faint uppercase tracking-wider">総件数</p>
            <p className="text-2xl font-bold text-ink mt-1">{reports.length}</p>
          </div>
          <div className="bg-pos-soft border border-pos/20 rounded-lg p-3 text-center">
            <p className="text-2xs text-pos/70 uppercase tracking-wider">新規・増加</p>
            <p className="text-2xl font-bold text-pos mt-1">{newCount + upCount}</p>
          </div>
          <div className="bg-neg-soft border border-neg/20 rounded-lg p-3 text-center">
            <p className="text-2xs text-neg/70 uppercase tracking-wider">減少</p>
            <p className="text-2xl font-bold text-neg mt-1">{downCount}</p>
          </div>
        </div>
      </div>

      {/* テーブル（デスクトップ） */}
      <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden hidden md:block">
        <div className="bg-navy px-4 py-3 flex items-center gap-2">
          <span className="w-0.5 h-4 bg-accent rounded-sm" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">大量保有一覧</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-paper-dark border-b border-paper-border">
              <tr>{["変更種別","対象企業","保有者","保有割合","前回比","株式数","提出日"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-ink-muted font-semibold whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {reports.map((r) => {
                const s = CS[r.changeType];
                const diff = r.previousRate != null ? r.holdingRate - r.previousRate : null;
                return (
                  <tr key={r.docID} className="hover:bg-paper transition-colors">
                    <td className="px-3 py-2.5"><span className={`text-2xs font-bold px-1.5 py-0.5 rounded ${s.badge}`}>{s.arrow} {r.changeType}</span></td>
                    <td className="px-3 py-2.5"><p className="font-semibold text-ink">{r.targetCompany}</p>{r.targetCode && <p className="text-2xs text-ink-faint">{r.targetCode}</p>}</td>
                    <td className="px-3 py-2.5 text-ink-muted max-w-[180px] truncate">{r.reporterName}</td>
                    <td className={`px-3 py-2.5 tabular-nums font-bold ${s.text}`}>{r.holdingRate.toFixed(2)}%</td>
                    <td className="px-3 py-2.5 tabular-nums">{diff != null ? <span className={diff > 0 ? "text-pos" : diff < 0 ? "text-neg" : "text-ink-muted"}>{diff > 0 ? "+" : ""}{diff.toFixed(2)}pp</span> : "—"}</td>
                    <td className="px-3 py-2.5 tabular-nums text-ink-muted">{formatShares(r.holdingShares)}</td>
                    <td className="px-3 py-2.5 text-ink-faint tabular-nums whitespace-nowrap">{formatSubmitDate(r.submitDateTime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* モバイルカード */}
      <div className="md:hidden space-y-3">
        {reports.map((r) => {
          const s = CS[r.changeType];
          const diff = r.previousRate != null ? r.holdingRate - r.previousRate : null;
          return (
            <div key={r.docID} className="bg-paper-surface border border-paper-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div><span className={`text-2xs font-bold px-1.5 py-0.5 rounded ${s.badge}`}>{s.arrow} {r.changeType}</span><p className="text-sm font-semibold text-ink mt-1.5">{r.targetCompany}</p></div>
                <p className={`text-lg font-bold tabular-nums ${s.text}`}>{r.holdingRate.toFixed(2)}%</p>
              </div>
              <p className="text-xs text-ink-muted">{r.reporterName}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-2xs text-ink-faint">{formatShares(r.holdingShares)}</p>
                {diff != null && <p className={`text-2xs ${diff > 0 ? "text-pos" : "text-neg"}`}>{diff > 0 ? "+" : ""}{diff.toFixed(2)}pp</p>}
                <p className="text-2xs text-ink-faint">{formatSubmitDate(r.submitDateTime)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
