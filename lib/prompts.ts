// プロンプト組み立て・カテゴリ定義
// 日経クロステック準拠のテックニュース特化カテゴリ

export type Level = "入門" | "実務" | "エグゼクティブ";

export const LEVELS: Level[] = ["入門", "実務", "エグゼクティブ"];

export interface TechCategory {
  id: string;
  label: string;
  description: string;
}

export const TECH_CATEGORIES: TechCategory[] = [
  { id: "it-general",    label: "IT総合",           description: "ITトレンド全般・プラットフォーム" },
  { id: "ai-genai",      label: "AI・生成AI",        description: "LLM・機械学習・自動化" },
  { id: "security",      label: "セキュリティ",      description: "サイバー攻撃・脆弱性・対策" },
  { id: "cloud-infra",   label: "クラウド・インフラ", description: "AWS/Azure/GCP・Kubernetes" },
  { id: "semiconductor", label: "半導体・デバイス",  description: "半導体供給・製造・設計" },
  { id: "dx-reform",     label: "DX・業務改革",      description: "企業DX・基幹刷新・SaaS導入" },
  { id: "mobility",      label: "自動車・モビリティ", description: "EV・自動運転・CASE" },
  { id: "manufacturing", label: "製造・スマート工場", description: "Industry4.0・ロボット・IoT" },
  { id: "space-defense", label: "宇宙・防衛テック",  description: "宇宙開発・防衛システム・衛星" },
  { id: "startup-vc",    label: "スタートアップ",    description: "資金調達・M&A・IPO動向" },
];

// 後方互換（既存の履歴データ対応）
export const PRESET_INDUSTRIES = TECH_CATEGORIES.map((c) => c.label);

const LEVEL_GUIDE: Record<Level, string> = {
  入門: "専門用語は最小限、平易な言葉で。初めて聞く人にも分かる補足を入れる。",
  実務: "具体的な企業名・数値を積極的に使い、示唆（So What）まで踏み込む。",
  エグゼクティブ: "要点と経営インパクト（収益・コスト・リスク・競争）だけを凝縮。",
};

/** ブリーフィング生成プロンプト（Web 検索あり・ニュース記事スタイル） */
export function buildBriefingPrompt(industry: string, level: Level): string {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return [
    `あなたは「${industry}」分野の最新テックニュースを解説するブリーフィング担当です。`,
    `Web検索で本日（${today}）の最新情報を集め、日本語Markdownで出力してください。`,
    `読者レベル: ${level}。方針: ${LEVEL_GUIDE[level]}`,
    ``,
    `以下の見出し構成を厳守（余計な前置き・結びは不要）:`,
    ``,
    `## 本日のトップニュース`,
    `（重要な最新ニュース 3 本を番号付きリストで。各行: **[企業名/サービス名]が〜** の見出し + 2文の説明）`,
    ``,
    `## 注目トレンド`,
    `（3〜4本。各: ### 見出し ＋ 2〜3文の解説 ＋ 「**重要な理由**: 〜」の1行）`,
    ``,
    `## キーワード解説`,
    `（4〜6語。**用語** — 1行説明の箇条書き）`,
    ``,
    `## 今日の視点`,
    `（1〜2つの問い・考察。簡潔な示唆）`,
    ``,
    `注意: 古い知識でなく検索結果に基づく最新事実を使うこと。具体的な企業名・数値を積極的に入れること。`,
  ].join("\n");
}

/** 企業スポットライト用プロンプト（Web 検索あり） */
export function buildSpotlightPrompt(company: string): string {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return [
    `「${company}」についての最新動向を Web 検索で調べ、日本語 Markdown で簡潔に報告してください。`,
    `対象: ${today}前後の直近ニュース。`,
    ``,
    `見出し構成（この3つだけ・余計な前置き不要）:`,
    ``,
    `## 最新ニュース`,
    `（直近の主要ニュース 3〜5 本をリスト形式で。日付・内容・意義を端的に）`,
    ``,
    `## 現在の注目ポイント`,
    `（事業・技術・競合・財務などで今最も注目すべき 2〜3 点を解説）`,
    ``,
    `## 短期の焦点`,
    `（今後 1〜3 か月で注目すべき動き・発表・リスク）`,
    ``,
    `具体的な数値・人名・製品名を積極的に入れること。`,
  ].join("\n");
}

/** 週次まとめプロンプト（Web 検索あり） */
export function buildWeeklyPrompt(category: string): string {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return [
    `「${category}」分野の今週（${today}時点の直近 7 日間）の動向を Web 検索でまとめ、日本語 Markdown で出力してください。`,
    ``,
    `見出し構成（この4つだけ）:`,
    ``,
    `## 今週のビッグニュース`,
    `（最重要ニュース 3〜5 本を箇条書き。各行に企業名・内容・意義）`,
    ``,
    `## 週のトレンドサマリー`,
    `（今週を通じて見えたトレンドや変化を 3〜4 点で解説）`,
    ``,
    `## 数字で振り返る今週`,
    `（株価変動・資金調達額・製品数など、具体的な数値を 3〜5 点）`,
    ``,
    `## 来週の注目イベント`,
    `（決算発表・製品発表・規制施行・カンファレンス等を 2〜3 件）`,
    ``,
    `具体的な企業名・数値・日付を入れること。`,
  ].join("\n");
}

/** クイズ生成プロンプト（JSON のみ） */
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

/** 用語深掘りプロンプト */
export function buildDeepdivePrompt(term: string, industry: string): string {
  return [
    `「${industry}」分野の文脈で、用語「${term}」を日本語Markdownで簡潔に解説してください。`,
    `構成: ①一言定義 ②なぜ今重要か ③実務担当者が押さえるべき論点（1〜2点）。`,
    `冗長にせず、読みやすい長さに収めること。`,
  ].join("\n");
}
