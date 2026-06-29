import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCompanyDetail } from "@/lib/edinet";
import { readCache } from "@/lib/cache";
import { formatJPY, formatRate, yoyLabel, formatSubmitDate, DOC_TYPE_COLOR } from "@/lib/format";
import { PLChart, BSChart, MarginChart } from "@/components/FinancialChart";
import SectionHeader from "@/components/SectionHeader";
import type { CompanyAnalysisCache } from "@/lib/types";
import CompanyAnalysisPanel from "./CompanyAnalysisPanel";

interface Props { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const company = await getCompanyDetail(code);
  return { title: company?.filerName ?? code };
}

export default async function CompanyPage({ params }: Props) {
  const { code } = await params;
  const company = await getCompanyDetail(code);
  if (!company) notFound();

  const latest = company.financials[company.financials.length - 1];
  const prev   = company.financials[company.financials.length - 2];
  const analysis = readCache<CompanyAnalysisCache>(`company-analysis/${code}`);

  const kpis = [
    { label: "売上高",    value: formatJPY(latest.netSales),        yoy: yoyLabel(latest.netSales, prev?.netSales) },
    { label: "営業利益",  value: formatJPY(latest.operatingIncome), yoy: yoyLabel(latest.operatingIncome, prev?.operatingIncome) },
    { label: "純利益",    value: formatJPY(latest.netIncome),       yoy: yoyLabel(latest.netIncome, prev?.netIncome) },
    { label: "総資産",    value: formatJPY(latest.totalAssets),     yoy: "" },
    { label: "純資産",    value: formatJPY(latest.equity),          yoy: "" },
    { label: "営業利益率",value: formatRate(latest.operatingMargin), yoy: "" },
    { label: "ROE",      value: formatRate(latest.roe),             yoy: "" },
    { label: "EPS",      value: latest.eps ? `¥${latest.eps.toLocaleString()}` : "—", yoy: "" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* ヘッダー */}
      <div className="bg-navy rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            {company.tickerCode && <span className="text-2xs bg-white/10 text-navy-muted rounded px-1.5 py-0.5 font-mono">{company.tickerCode}</span>}
            {company.marketSegment && <span className="text-2xs bg-accent/20 text-accent border border-accent/20 rounded px-1.5 py-0.5">{company.marketSegment}</span>}
            {company.industry && <span className="text-2xs text-navy-muted">{company.industry}</span>}
          </div>
          <h1 className="text-xl font-bold text-white">{company.filerName}</h1>
          <p className="text-xs text-navy-muted mt-0.5">EDINET: {company.edinetCode}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/compare" className="text-2xs bg-accent hover:bg-accent-hover text-white rounded px-3 py-1.5 transition-colors">比較に追加</Link>
        </div>
      </div>

      {/* KPI */}
      <div>
        <SectionHeader title={`財務ハイライト（${latest.period}）`} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map((k) => {
            const isPos = k.yoy.startsWith("+");
            const isNeg = k.yoy.startsWith("-") || k.yoy.startsWith("▲");
            return (
              <div key={k.label} className="bg-paper-surface border border-paper-border rounded-lg p-3">
                <p className="text-2xs text-ink-faint uppercase tracking-wider">{k.label}</p>
                <p className="text-base font-bold text-ink mt-1 tabular-nums">{k.value}</p>
                {k.yoy && <p className={`text-2xs mt-0.5 font-medium ${isPos ? "text-pos" : isNeg ? "text-neg" : "text-ink-muted"}`}>{k.yoy} 前年比</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* チャート */}
      <div className="space-y-4">
        <div className="bg-paper-surface border border-paper-border rounded-lg p-4">
          <SectionHeader title="売上・利益推移（5年）" sub="億円" />
          <PLChart data={company.financials} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-paper-surface border border-paper-border rounded-lg p-4">
            <SectionHeader title="貸借対照表" sub="億円" />
            <BSChart data={company.financials} />
          </div>
          <div className="bg-paper-surface border border-paper-border rounded-lg p-4">
            <SectionHeader title="収益性指標" sub="%" />
            <MarginChart data={company.financials} />
          </div>
        </div>
      </div>

      {/* AI分析 */}
      <CompanyAnalysisPanel edinetCode={code} filerName={company.filerName} cachedAnalysis={analysis} />

      {/* 5年テーブル */}
      <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden">
        <div className="bg-navy px-4 py-3 flex items-center gap-2">
          <span className="w-0.5 h-4 bg-accent rounded-sm" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">財務サマリー（5年）</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-paper-dark border-b border-paper-border">
              <tr>{["期","売上高","営業利益","純利益","総資産","純資産","営業利益率","ROE"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-ink-muted font-semibold whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {[...company.financials].reverse().map((f, i) => (
                <tr key={f.fiscalYear} className={`hover:bg-paper transition-colors ${i === 0 ? "bg-accent-soft/50" : ""}`}>
                  <td className="px-3 py-2 font-medium text-ink whitespace-nowrap">{f.period}</td>
                  <td className="px-3 py-2 tabular-nums text-right">{formatJPY(f.netSales)}</td>
                  <td className="px-3 py-2 tabular-nums text-right">{formatJPY(f.operatingIncome)}</td>
                  <td className="px-3 py-2 tabular-nums text-right">{formatJPY(f.netIncome)}</td>
                  <td className="px-3 py-2 tabular-nums text-right text-ink-muted">{formatJPY(f.totalAssets)}</td>
                  <td className="px-3 py-2 tabular-nums text-right text-ink-muted">{formatJPY(f.equity)}</td>
                  <td className="px-3 py-2 tabular-nums text-right">{formatRate(f.operatingMargin)}</td>
                  <td className="px-3 py-2 tabular-nums text-right">{formatRate(f.roe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 開示書類 */}
      {company.recentFilings.length > 0 && (
        <div>
          <SectionHeader title="開示書類" />
          <div className="bg-paper-surface border border-paper-border rounded-lg overflow-hidden divide-y divide-paper-border">
            {company.recentFilings.map((f) => (
              <div key={f.docID} className="px-4 py-3 hover:bg-paper transition-colors flex items-start gap-3">
                <span className={`shrink-0 text-2xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${DOC_TYPE_COLOR[f.docType] ?? "bg-ink-mid text-white"}`}>{f.docTypeLabel}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium">{f.docDescription}</p>
                  {f.periodEnd && <p className="text-2xs text-ink-muted mt-0.5">対象期間: {f.periodEnd}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-2xs text-ink-faint tabular-nums">{formatSubmitDate(f.submitDateTime)}</span>
                  <Link href={`/disclosure/${f.docID}?company=${encodeURIComponent(company.filerName)}&desc=${encodeURIComponent(f.docDescription)}`}
                    className="text-2xs bg-navy text-white rounded px-2 py-1 hover:bg-navy-mid transition-colors whitespace-nowrap">
                    AI要約
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
