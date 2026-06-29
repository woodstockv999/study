import type { RssItem, FinancialSnapshot } from "./types";

export function buildRssSummaryPrompt(items: RssItem[]): string {
  const list = items
    .map((it, i) => `[${i}] ${it.title}\n${it.description.slice(0, 200)}`)
    .join("\n\n");

  return `以下のニュース記事を分析し、JSON配列のみ返してください（説明文不要）。

${list}

[
  {
    "index": 0,
    "summary": "2文の日本語要約",
    "importance": 3,
    "tags": ["経済"]
  }
]

importance: 1〜5（5が最重要・速報レベル）
tags: ["経済","テック","AI","政治","国際","社会","マーケット","企業","エネルギー","医療"] から選ぶ`;
}

export function buildCompanyAnalysisPrompt(
  companyName: string,
  financials: FinancialSnapshot[]
): string {
  const rows = financials
    .map(
      (f) =>
        `${f.period}: 売上${f.netSales.toLocaleString()}M 営業利益${f.operatingIncome.toLocaleString()}M 純利益${f.netIncome.toLocaleString()}M 利益率${f.operatingMargin?.toFixed(1)}% ROE${f.roe?.toFixed(1)}%`
    )
    .join("\n");

  return `証券アナリストとして、${companyName}の財務データを分析してください。

【財務データ（百万円）】
${rows}

以下の観点で800字以内・日本語で：
1. 収益トレンド（成長率と方向性）
2. 収益性（利益率・ROEの水準）
3. 強みと注目点
4. リスク・懸念点
5. 総合評価（1〜2文）`;
}

export function buildDisclosurePrompt(
  filerName: string,
  docDescription: string,
  content: string
): string {
  return `財務アナリストとして、以下の有価証券報告書を要約してください。

【提出会社】${filerName}
【書類名】${docDescription}

【本文】
${content.slice(0, 6000)}

以下のJSONのみ返してください：
{
  "overview": ["事業概況を1文で3点"],
  "changes": ["今期の重要な変化・トピックを1文で3点"],
  "risks": ["リスク要因を1文で3点"],
  "financials": ["財務上の特徴を1文で3点"]
}`;
}
