import type { RssItem, FinancialSnapshot } from "./types";

// ─── ブリーフィングbot ───────────────────────────────────────────
export type Level = "入門" | "実務" | "エグゼクティブ";
export const LEVELS: Level[] = ["入門", "実務", "エグゼクティブ"];

export interface TechCategory { id: string; label: string; description: string; }
export const TECH_CATEGORIES: TechCategory[] = [
  // ── 経営・戦略 ──
  { id: "strategy-ma",   label: "経営戦略・M&A",      description: "買収・提携・事業再編・競争戦略" },
  { id: "macro-finance", label: "マクロ経済・金融",    description: "金利・為替・景気・マーケット動向" },
  { id: "policy-reg",    label: "規制・政策",          description: "法規制・政府方針・産業政策・貿易" },
  { id: "esg",           label: "ESG・サステナビリティ", description: "脱炭素・SDGs・コーポレートガバナンス" },
  { id: "hr-org",        label: "人事・組織変革",      description: "働き方改革・リーダーシップ・人材戦略" },
  // ── テクノロジー ──
  { id: "ai-genai",      label: "AI・生成AI",          description: "LLM・機械学習・業務自動化・規制動向" },
  { id: "dx-reform",     label: "DX・デジタル変革",    description: "企業DX・SaaS導入・業務改革事例" },
  { id: "semiconductor", label: "半導体・デバイス",    description: "半導体供給・製造・設計・地政学リスク" },
  { id: "security",      label: "サイバーセキュリティ", description: "攻撃事例・リスク管理・ゼロトラスト" },
  { id: "cloud-infra",   label: "クラウド・インフラ",  description: "AWS/Azure/GCP・コスト最適化" },
  // ── 産業 ──
  { id: "mobility",      label: "自動車・モビリティ",  description: "EV・自動運転・CASE・業界再編" },
  { id: "manufacturing", label: "製造・サプライチェーン", description: "スマート工場・調達リスク・脱中国" },
  { id: "startup-vc",    label: "スタートアップ・VC",  description: "資金調達・ユニコーン・IPO・M&A" },
  { id: "global-trade",  label: "グローバル・地政学",  description: "貿易摩擦・関税・地政学リスク・アライアンス" },
];
export const PRESET_INDUSTRIES = TECH_CATEGORIES.map((c) => c.label);

const LEVEL_GUIDE: Record<Level, string> = {
  入門: "専門用語は最小限、平易な言葉で。初めて聞く人にも分かる補足を入れる。",
  実務: "具体的な企業名・数値・事例を積極的に使い、実務担当者が即使える示唆まで踏み込む。",
  エグゼクティブ: "1枚メモとして使える密度で。経営判断に直結する示唆（競争・収益・リスク）に絞り込む。前置きは不要。",
};

export function buildBriefingPrompt(industry: string, level: Level): string {
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  return [
    `あなたはコンサルタント向けに「${industry}」分野の最新動向を届けるブリーフィング担当です。`,
    `Web検索で本日（${today}）の最新情報を集め、日本語Markdownで出力してください。`,
    `読者レベル: ${level}。方針: ${LEVEL_GUIDE[level]}`,
    ``,
    `以下の見出し構成を厳守（余計な前置き・結びは不要）:`,
    ``,
    `## 本日のトップニュース`,
    `（重要な最新ニュース 3 本を番号付きリストで。各行: **[企業名/組織名]が〜** の見出し + 2文の説明。日付・数値を必ず含める）`,
    ``,
    `## 注目トレンド`,
    `（3〜4本。各: ### 見出し ＋ 2〜3文の解説 ＋ 「**なぜ重要か**: 〜」の1行）`,
    ``,
    `## コンサルタント視点`,
    `（この動向がクライアント企業の経営・事業戦略にどう影響するか。競争環境の変化・意思決定への示唆・機会とリスクを箇条書き3点で端的に）`,
    ``,
    `## 今週注目のアクション`,
    `（クライアントとの対話・調査・提案準備で今週動くべきことを2点）`,
    ``,
    `注意: 古い知識でなく検索結果に基づく最新事実を使うこと。具体的な企業名・数値・日付を積極的に入れること。`,
  ].join("\n");
}

export function buildSpotlightPrompt(company: string): string {
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  return [
    `「${company}」についての最新動向を Web 検索で調べ、コンサルタントがミーティング前に読む資料として日本語 Markdown で報告してください。`,
    `対象: ${today}前後の直近ニュース。余計な前置き不要。`,
    ``,
    `見出し構成（この4つだけ）:`,
    ``,
    `## 直近の主要ニュース`,
    `（重要ニュース 3〜5 本をリスト。日付・内容・数値を端的に）`,
    ``,
    `## 現在の注目ポイント`,
    `（事業・競合・財務・組織で今最も注目すべき 2〜3 点）`,
    ``,
    `## ミーティング前チェックリスト`,
    `（この相手と話す前に押さえるべき論点・リスク・機会を箇条書き3点。コンサルタント視点で）`,
    ``,
    `## 短期の焦点`,
    `（今後 1〜3 か月で注目すべき動き・発表・リスク）`,
    ``,
    `具体的な数値・人名・製品名・競合他社名を積極的に入れること。`,
  ].join("\n");
}

export function buildWeeklyPrompt(category: string): string {
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  return [
    `「${category}」分野の今週（${today}時点の直近 7 日間）の動向を Web 検索でまとめ、コンサルタント向けの週次レビューとして日本語 Markdown で出力してください。`,
    ``,
    `見出し構成（この5つだけ）:`,
    ``,
    `## 今週のビッグニュース`,
    `（最重要ニュース 3〜5 本。各行に企業名・内容・数値・日付）`,
    ``,
    `## 週のトレンドサマリー`,
    `（今週を通じて見えた構造的変化・トレンドを 3 点で解説）`,
    ``,
    `## 戦略的含意`,
    `（この動向からコンサルタント・経営者として何を読み取るべきか。競争地図の変化・クライアントへの示唆・次の一手を箇条書き3点）`,
    ``,
    `## 数字で振り返る今週`,
    `（株価・資金調達額・市場シェア・契約件数など具体的数値を 3〜5 点）`,
    ``,
    `## 来週の注目アクション`,
    `（決算・製品発表・規制施行・イベント等と、それに対してクライアントや自社が取るべき行動）`,
    ``,
    `具体的な企業名・数値・日付を必ず入れること。`,
  ].join("\n");
}

export function buildQuizPrompt(briefingText: string): string {
  return [
    `以下のブリーフィング本文に基づく4択クイズを3問作成してください。`,
    `出力はJSONのみ。前置き・説明・Markdownコードフェンス（\`\`\`）は一切禁止。`,
    `スキーマ: {"questions":[{"q":"問題文","options":["A","B","C","D"],"answer":0,"explanation":"解説"}]}`,
    `answer は正解の options インデックス（0〜3）。日本語で。`,
    ``,
    `--- ブリーフィング本文 ---`,
    briefingText.slice(0, 6000),
  ].join("\n");
}

export function buildDeepdivePrompt(term: string, industry: string): string {
  return [
    `「${industry}」分野の文脈で、用語「${term}」を日本語Markdownで簡潔に解説してください。`,
    `構成: ①一言定義 ②なぜ今重要か ③実務担当者が押さえるべき論点（1〜2点）。`,
    `冗長にせず、読みやすい長さに収めること。`,
  ].join("\n");
}

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
