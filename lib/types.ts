// RSS + EDINET 統合型定義

// ─── RSS ─────────────────────────────────────────────────────
export interface RssItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  summary?: string;     // AI生成
  importance?: number;  // 1-5
  tags?: string[];      // AI生成
}

export interface RssCache {
  items: RssItem[];
  fetchedAt: string;
  summarizedAt?: string;
}

// ─── EDINET ──────────────────────────────────────────────────
export interface Company {
  edinetCode: string;
  filerName: string;
  tickerCode?: string;
  industry?: string;
  marketSegment?: string;
}

export interface Filing {
  docID: string;
  edinetCode: string;
  filerName: string;
  docType: number;
  docTypeLabel: string;
  periodStart?: string;
  periodEnd?: string;
  submitDateTime: string;
  docDescription: string;
}

export interface FinancialSnapshot {
  period: string;
  fiscalYear: string;
  netSales: number;
  operatingIncome: number;
  ordinaryIncome: number;
  netIncome: number;
  totalAssets: number;
  equity: number;
  cashAndEquiv?: number;
  eps?: number;
  bps?: number;
  roe?: number;
  roa?: number;
  operatingMargin?: number;
}

export interface CompanyDetail extends Company {
  financials: FinancialSnapshot[];
  recentFilings: Filing[];
}

export interface BulkReport {
  docID: string;
  reporterName: string;
  targetCompany: string;
  targetCode?: string;
  holdingRate: number;
  holdingShares: number;
  submitDateTime: string;
  changeType: "新規" | "増加" | "減少" | "変更";
  previousRate?: number;
}

export interface DashboardStats {
  totalFilings: number;
  annualReports: number;
  quarterlyReports: number;
  bulkReports: number;
  date: string;
}

// ─── 解析キャッシュ ─────────────────────────────────────────
export interface CompanyAnalysisCache {
  edinetCode: string;
  filerName: string;
  text: string;
  analyzedAt: string;
}

export interface DisclosureCache {
  docID: string;
  filerName: string;
  docDescription: string;
  overview: string[];
  changes: string[];
  risks: string[];
  financials: string[];
  analyzedAt: string;
}
