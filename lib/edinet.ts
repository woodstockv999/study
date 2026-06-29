import type { Filing, BulkReport, CompanyDetail } from "./types";
import { MOCK_RECENT_FILINGS, MOCK_BULK_REPORTS, MOCK_STATS, MOCK_COMPANIES, getMockCompanyDetail } from "./mock";
import { DOC_TYPE_LABEL } from "./format";

const EDINET_BASE = "https://disclosure.edinet-fsa.go.jp/api/v2";

export function isDemoMode() { return !process.env.EDINET_API_KEY; }
function headers() { return { "Subscription-Key": process.env.EDINET_API_KEY! }; }

export async function getFilings(date: string, type?: number): Promise<Filing[]> {
  if (isDemoMode()) return MOCK_RECENT_FILINGS;
  const params = new URLSearchParams({ date, type: String(type ?? 2) });
  const res = await fetch(`${EDINET_BASE}/documents.json?${params}`, { headers: headers(), next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`EDINET ${res.status}`);
  const json = await res.json();
  return (json.results ?? []).map((r: any) => ({
    docID: r.docID, edinetCode: r.edinetCode, filerName: r.filerName,
    docType: r.docTypeCode ?? type ?? 2, docTypeLabel: DOC_TYPE_LABEL[r.docTypeCode ?? 2] ?? "—",
    periodStart: r.periodStart, periodEnd: r.periodEnd,
    submitDateTime: r.submitDateTime, docDescription: r.docDescription ?? "",
  }));
}

export async function getBulkReports(): Promise<BulkReport[]> {
  if (isDemoMode()) return MOCK_BULK_REPORTS;
  const d = new Date().toISOString().slice(0, 10);
  const filings = await getFilings(d, 120);
  return filings.map((f) => ({
    docID: f.docID, reporterName: f.filerName, targetCompany: f.docDescription,
    holdingRate: 5.0, holdingShares: 100000,
    submitDateTime: f.submitDateTime, changeType: "変更" as const,
  }));
}

export function searchCompanies(query: string) {
  const q = query.toLowerCase();
  return MOCK_COMPANIES.filter(
    (c) => !q || c.filerName.includes(query) || c.edinetCode.toLowerCase().includes(q) || (c.tickerCode ?? "").includes(query)
  );
}

export async function getCompanyDetail(edinetCode: string): Promise<CompanyDetail | null> {
  // Real XBRL parsing TODO when API key available
  return getMockCompanyDetail(edinetCode);
}

export async function getDashboardStats() {
  if (isDemoMode()) return MOCK_STATS;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const [all, bulk] = await Promise.all([getFilings(today), getBulkReports()]);
    return { totalFilings: all.length, annualReports: all.filter((f) => f.docType === 2).length, quarterlyReports: all.filter((f) => f.docType === 4).length, bulkReports: bulk.length, date: today };
  } catch { return MOCK_STATS; }
}

/** DEMOモード用の開示文書モックテキスト */
export function getMockDocumentContent(docID: string, filerName: string): string {
  return `【事業の概況】
${filerName}は当期において、主力事業の売上が前年比で増加しました。国内市場では価格競争が続く中、高付加価値製品・サービスへのシフトを継続しました。海外市場では北米・アジア地域での拡大が続いています。デジタルトランスフォーメーションへの投資を加速し、業務効率化と新サービス開発を推進しました。

【主要な変化】
・新中期経営計画を発表し、2027年度に向けた成長戦略を明示
・主力製品の大型刷新により、シェア拡大を目指す
・環境対応（GHG削減・サプライチェーン脱炭素化）の目標を強化
・デジタル・AI関連投資を前年比30%増に拡大

【リスク要因】
・地政学リスク（米中摩擦・サプライチェーン分断）の影響が継続
・原材料・エネルギーコストの高止まりによる利益率圧迫
・人材確保難（エンジニア・専門職）によるプロジェクト遅延リスク
・サイバーセキュリティリスクの高まりと対応コストの増加

【財務状況】
・売上高は前年比増収、営業利益は前年比増益を達成
・自己資本比率は安定的に維持、財務基盤の健全性を確保
・設備投資は計画通り実施、将来成長に向けた投資を継続
・配当は前年から増配、株主還元を強化`;
}
