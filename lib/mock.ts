import type { Company, CompanyDetail, Filing, BulkReport, DashboardStats } from "./types";

export const MOCK_COMPANIES: Company[] = [
  { edinetCode: "E02144", filerName: "トヨタ自動車株式会社",              tickerCode: "7203", industry: "自動車",     marketSegment: "プライム" },
  { edinetCode: "E02000", filerName: "ソニーグループ株式会社",            tickerCode: "6758", industry: "電気機器",   marketSegment: "プライム" },
  { edinetCode: "E04577", filerName: "日本電信電話株式会社",              tickerCode: "9432", industry: "情報・通信", marketSegment: "プライム" },
  { edinetCode: "E01514", filerName: "日立製作所",                        tickerCode: "6501", industry: "電気機器",   marketSegment: "プライム" },
  { edinetCode: "E02275", filerName: "任天堂株式会社",                    tickerCode: "7974", industry: "その他製品", marketSegment: "プライム" },
  { edinetCode: "E05080", filerName: "ソフトバンクグループ株式会社",      tickerCode: "9984", industry: "情報・通信", marketSegment: "プライム" },
  { edinetCode: "E03592", filerName: "三菱UFJフィナンシャル・グループ",  tickerCode: "8306", industry: "銀行業",     marketSegment: "プライム" },
  { edinetCode: "E01530", filerName: "キーエンス株式会社",                tickerCode: "6861", industry: "電気機器",   marketSegment: "プライム" },
  { edinetCode: "E33473", filerName: "リクルートホールディングス",        tickerCode: "6098", industry: "サービス業", marketSegment: "プライム" },
  { edinetCode: "E04821", filerName: "NTTデータグループ株式会社",         tickerCode: "9613", industry: "情報・通信", marketSegment: "プライム" },
];

const TOYOTA_FINANCIALS = [
  { period: "2021年3月期", fiscalYear: "FY2021", netSales: 27214894, operatingIncome: 2197748, ordinaryIncome: 2404005, netIncome: 2245261, totalAssets: 66297000, equity: 24167000, eps: 150.2, roe: 9.3, operatingMargin: 8.1 },
  { period: "2022年3月期", fiscalYear: "FY2022", netSales: 31379507, operatingIncome: 2995697, ordinaryIncome: 3257888, netIncome: 2850110, totalAssets: 73000000, equity: 27000000, eps: 192.4, roe: 11.0, operatingMargin: 9.5 },
  { period: "2023年3月期", fiscalYear: "FY2023", netSales: 37154298, operatingIncome: 2725025, ordinaryIncome: 3289177, netIncome: 2451318, totalAssets: 84000000, equity: 30000000, eps: 172.2, roe: 8.6, operatingMargin: 7.3 },
  { period: "2024年3月期", fiscalYear: "FY2024", netSales: 45095325, operatingIncome: 5352934, ordinaryIncome: 5729595, netIncome: 4944933, totalAssets: 100000000, equity: 37000000, eps: 356.0, roe: 14.9, operatingMargin: 11.9 },
  { period: "2025年3月期", fiscalYear: "FY2025", netSales: 46500000, operatingIncome: 4800000, ordinaryIncome: 5100000, netIncome: 4200000, totalAssets: 105000000, equity: 40000000, eps: 305.0, roe: 11.0, operatingMargin: 10.3 },
];

const SONY_FINANCIALS = [
  { period: "2021年3月期", fiscalYear: "FY2021", netSales: 8999752,  operatingIncome: 942690,  ordinaryIncome: 950000,  netIncome: 1167623, totalAssets: 23278038, equity: 4688000, eps: 908.0, roe: 13.0, operatingMargin: 10.5 },
  { period: "2022年3月期", fiscalYear: "FY2022", netSales: 9921513,  operatingIncome: 1202671, ordinaryIncome: 1220000, netIncome: 882177,  totalAssets: 26200000, equity: 5100000, eps: 691.0, roe: 18.0, operatingMargin: 12.1 },
  { period: "2023年3月期", fiscalYear: "FY2023", netSales: 11539837, operatingIncome: 1192706, ordinaryIncome: 1210000, netIncome: 899970,  totalAssets: 28900000, equity: 5500000, eps: 705.0, roe: 17.0, operatingMargin: 10.3 },
  { period: "2024年3月期", fiscalYear: "FY2024", netSales: 13020765, operatingIncome: 1207834, ordinaryIncome: 1230000, netIncome: 970228,  totalAssets: 32100000, equity: 6300000, eps: 769.0, roe: 16.3, operatingMargin: 9.3 },
  { period: "2025年3月期", fiscalYear: "FY2025", netSales: 13300000, operatingIncome: 1100000, ordinaryIncome: 1120000, netIncome: 850000,  totalAssets: 33500000, equity: 6800000, eps: 680.0, roe: 13.0, operatingMargin: 8.3 },
];

const NTT_FINANCIALS = [
  { period: "2021年3月期", fiscalYear: "FY2021", netSales: 11943966, operatingIncome: 1572779, ordinaryIncome: 1580000, netIncome: 892934,  totalAssets: 26000000, equity: 9500000,  eps: 234.0, roe: 9.5,  operatingMargin: 13.2 },
  { period: "2022年3月期", fiscalYear: "FY2022", netSales: 12156465, operatingIncome: 1616832, ordinaryIncome: 1625000, netIncome: 982803,  totalAssets: 27500000, equity: 10200000, eps: 259.0, roe: 10.0, operatingMargin: 13.3 },
  { period: "2023年3月期", fiscalYear: "FY2023", netSales: 13136433, operatingIncome: 1699457, ordinaryIncome: 1710000, netIncome: 1131175, totalAssets: 29800000, equity: 10800000, eps: 308.0, roe: 11.0, operatingMargin: 12.9 },
  { period: "2024年3月期", fiscalYear: "FY2024", netSales: 13366263, operatingIncome: 1764630, ordinaryIncome: 1780000, netIncome: 1018467, totalAssets: 30600000, equity: 11000000, eps: 320.0, roe: 9.4,  operatingMargin: 13.2 },
  { period: "2025年3月期", fiscalYear: "FY2025", netSales: 13600000, operatingIncome: 1800000, ordinaryIncome: 1815000, netIncome: 1050000, totalAssets: 31200000, equity: 11400000, eps: 340.0, roe: 9.4,  operatingMargin: 13.2 },
];

const NINTENDO_FINANCIALS = [
  { period: "2021年3月期", fiscalYear: "FY2021", netSales: 1758910, operatingIncome: 640634, ordinaryIncome: 643000, netIncome: 480376, totalAssets: 2669000, equity: 2269000, eps: 3582.0, roe: 22.0, operatingMargin: 36.4 },
  { period: "2022年3月期", fiscalYear: "FY2022", netSales: 1695344, operatingIncome: 572586, ordinaryIncome: 575000, netIncome: 477691, totalAssets: 3024000, equity: 2556000, eps: 3562.0, roe: 19.8, operatingMargin: 33.8 },
  { period: "2023年3月期", fiscalYear: "FY2023", netSales: 1601677, operatingIncome: 504377, ordinaryIncome: 507000, netIncome: 432741, totalAssets: 3162000, equity: 2690000, eps: 3228.0, roe: 16.4, operatingMargin: 31.5 },
  { period: "2024年3月期", fiscalYear: "FY2024", netSales: 1671638, operatingIncome: 528246, ordinaryIncome: 530000, netIncome: 490073, totalAssets: 3572000, equity: 3026000, eps: 3655.0, roe: 17.0, operatingMargin: 31.6 },
  { period: "2025年3月期", fiscalYear: "FY2025", netSales: 1150000, operatingIncome: 280000, ordinaryIncome: 282000, netIncome: 220000, totalAssets: 3300000, equity: 3100000, eps: 1641.0, roe: 7.2,  operatingMargin: 24.3 },
];

const financialsMap: Record<string, typeof TOYOTA_FINANCIALS> = {
  E02144: TOYOTA_FINANCIALS, E02000: SONY_FINANCIALS,
  E04577: NTT_FINANCIALS,    E02275: NINTENDO_FINANCIALS,
};

function defaultFinancials(code: string) {
  const base = [420000, 480000, 510000, 540000, 580000];
  return base.map((v, i) => ({
    period: `${2021 + i}年3月期`, fiscalYear: `FY${2021 + i}`,
    netSales: v, operatingIncome: Math.round(v * 0.1), ordinaryIncome: Math.round(v * 0.105),
    netIncome: Math.round(v * 0.07), totalAssets: Math.round(v * 4), equity: Math.round(v * 2),
    eps: 320 + i * 15, roe: 7 + i * 0.5, operatingMargin: 10 + i * 0.2,
  }));
}

export function getMockCompanyDetail(code: string): CompanyDetail | null {
  const company = MOCK_COMPANIES.find((c) => c.edinetCode === code);
  if (!company) return null;
  const financials = financialsMap[code] ?? defaultFinancials(code);
  const n = parseInt(code.slice(-2)) || 1;
  const recentFilings: Filing[] = [
    { docID: `S100${code.slice(-4)}01`, edinetCode: code, filerName: company.filerName, docType: 2, docTypeLabel: "有価証券報告書", periodStart: "2024-04-01", periodEnd: "2025-03-31", submitDateTime: "2025-06-25T09:00:00", docDescription: `有価証券報告書－第${100 + n}期` },
    { docID: `S100${code.slice(-4)}02`, edinetCode: code, filerName: company.filerName, docType: 4, docTypeLabel: "四半期報告書",   periodStart: "2025-04-01", periodEnd: "2025-06-30", submitDateTime: "2025-08-10T09:00:00", docDescription: `第${100 + n}期第1四半期報告書` },
  ];
  return { ...company, financials, recentFilings };
}

export const MOCK_RECENT_FILINGS: Filing[] = [
  { docID: "S10073A1", edinetCode: "E02144", filerName: "トヨタ自動車株式会社",          docType: 2,   docTypeLabel: "有価証券報告書", periodEnd: "2025-03-31", submitDateTime: "2025-06-25T09:00:00", docDescription: "有価証券報告書－第121期" },
  { docID: "S10073A2", edinetCode: "E02000", filerName: "ソニーグループ株式会社",        docType: 2,   docTypeLabel: "有価証券報告書", periodEnd: "2025-03-31", submitDateTime: "2025-06-25T10:00:00", docDescription: "有価証券報告書－第109期" },
  { docID: "S10073B1", edinetCode: "E03592", filerName: "三菱UFJフィナンシャル・グループ", docType: 2, docTypeLabel: "有価証券報告書", periodEnd: "2025-03-31", submitDateTime: "2025-06-24T09:30:00", docDescription: "有価証券報告書－第22期" },
  { docID: "S10073B2", edinetCode: "E01530", filerName: "キーエンス株式会社",            docType: 2,   docTypeLabel: "有価証券報告書", periodEnd: "2025-03-31", submitDateTime: "2025-06-24T10:30:00", docDescription: "有価証券報告書－第51期" },
  { docID: "S10073C1", edinetCode: "E04577", filerName: "日本電信電話株式会社",          docType: 4,   docTypeLabel: "四半期報告書",   periodEnd: "2025-06-30", submitDateTime: "2025-08-08T09:00:00", docDescription: "第30期第1四半期報告書" },
  { docID: "S10073C2", edinetCode: "E02275", filerName: "任天堂株式会社",                docType: 4,   docTypeLabel: "四半期報告書",   periodEnd: "2025-06-30", submitDateTime: "2025-08-07T09:00:00", docDescription: "第86期第1四半期報告書" },
  { docID: "S10073D1", edinetCode: "E05080", filerName: "ソフトバンクグループ株式会社",  docType: 4,   docTypeLabel: "四半期報告書",   periodEnd: "2025-06-30", submitDateTime: "2025-08-10T14:00:00", docDescription: "第45期第1四半期報告書" },
  { docID: "S10073E1", edinetCode: "E33473", filerName: "リクルートホールディングス",    docType: 2,   docTypeLabel: "有価証券報告書", periodEnd: "2025-03-31", submitDateTime: "2025-05-30T09:00:00", docDescription: "有価証券報告書－第61期" },
];

export const MOCK_BULK_REPORTS: BulkReport[] = [
  { docID: "B10001", reporterName: "ブラックロック・ジャパン株式会社",      targetCompany: "トヨタ自動車株式会社",          targetCode: "7203", holdingRate: 6.82, holdingShares: 945230,  submitDateTime: "2025-06-27T15:00:00", changeType: "増加", previousRate: 6.21 },
  { docID: "B10002", reporterName: "バンガード・グループ",                 targetCompany: "ソニーグループ株式会社",          targetCode: "6758", holdingRate: 8.14, holdingShares: 102600,  submitDateTime: "2025-06-26T15:00:00", changeType: "新規" },
  { docID: "B10003", reporterName: "フィデリティ投信株式会社",             targetCompany: "任天堂株式会社",                  targetCode: "7974", holdingRate: 5.23, holdingShares: 70100,   submitDateTime: "2025-06-25T15:00:00", changeType: "減少", previousRate: 5.89 },
  { docID: "B10004", reporterName: "ノルウェー政府年金基金グローバル",      targetCompany: "キーエンス株式会社",              targetCode: "6861", holdingRate: 3.45, holdingShares: 92400,   submitDateTime: "2025-06-24T15:00:00", changeType: "増加", previousRate: 3.10 },
  { docID: "B10005", reporterName: "三井住友DSアセットマネジメント株式会社", targetCompany: "日立製作所",                    targetCode: "6501", holdingRate: 5.67, holdingShares: 560000,  submitDateTime: "2025-06-23T15:00:00", changeType: "変更", previousRate: 5.60 },
  { docID: "B10006", reporterName: "マッキンゼー・ファンド",               targetCompany: "NTTデータグループ株式会社",       targetCode: "9613", holdingRate: 7.30, holdingShares: 210000,  submitDateTime: "2025-06-22T15:00:00", changeType: "新規" },
  { docID: "B10007", reporterName: "JPモルガン・アセット・マネジメント",    targetCompany: "リクルートホールディングス",      targetCode: "6098", holdingRate: 4.88, holdingShares: 81200,   submitDateTime: "2025-06-20T15:00:00", changeType: "減少", previousRate: 5.12 },
  { docID: "B10008", reporterName: "アセットマネジメントOne株式会社",       targetCompany: "ソフトバンクグループ株式会社",    targetCode: "9984", holdingRate: 9.41, holdingShares: 1120000, submitDateTime: "2025-06-19T15:00:00", changeType: "増加", previousRate: 9.10 },
];

export const MOCK_STATS: DashboardStats = {
  totalFilings: 248, annualReports: 42, quarterlyReports: 156, bulkReports: 50,
  date: "2025-06-27",
};
