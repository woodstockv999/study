// レベル別プロンプト組み立て。
// トークン節約を最優先し、簡潔に保つ。出力フォーマットは仕様 4-1 に固定。

export type Level = "入門" | "実務" | "エグゼクティブ";

export const LEVELS: Level[] = ["入門", "実務", "エグゼクティブ"];

export const PRESET_INDUSTRIES = [
  "小売",
  "金融",
  "IT・ソフトウェア",
  "製造",
  "ヘルスケア",
  "エネルギー",
  "物流",
  "不動産",
];

const LEVEL_GUIDE: Record<Level, string> = {
  入門: "前提知識ゼロでも分かる平易な言葉。専門用語は最小限で必ず一言補足。",
  実務: "業界用語を適切に使い、事実だけでなく示唆（So What）まで踏み込む。",
  エグゼクティブ: "要点を凝縮。経営インパクト（収益・コスト・リスク・競争）中心。",
};

/** ブリーフィング生成プロンプト（Web 検索あり） */
export function buildBriefingPrompt(industry: string, level: Level): string {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return [
    `あなたは「${industry}」業界に精通したコンサルタント向けブリーフィング担当です。`,
    `Web検索で本日（${today}）時点の最新情報を集め、日本語のMarkdownで簡潔に出力してください。`,
    `読者レベル: ${level}。方針: ${LEVEL_GUIDE[level]}`,
    ``,
    `次の見出し構成を厳守（この4つだけ・余計な前置きや結びは不要）:`,
    `## 今日のサマリー`,
    `（3行以内）`,
    `## 注目トレンド`,
    `（3〜5本。各：### 見出し ＋ 2〜3文の説明 ＋ 「なぜ重要か」を1文）`,
    `## 押さえるべきキーワード`,
    `（3〜5語。各「**用語** — 1行説明」の箇条書き）`,
    `## コンサル視点の論点`,
    `（クライアントにこう問える、という問いを2つ箇条書き）`,
    ``,
    `古い記憶ではなく検索で得た最新の事実に基づくこと。冗長な表現は避け簡潔に。`,
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
    `「${industry}」業界の文脈で、用語「${term}」を日本語Markdownで簡潔に解説してください。`,
    `構成: ①一言定義 ②なぜ今重要か ③コンサルが押さえるべき論点（1〜2点）。`,
    `冗長にせず、合計で読みやすい長さに収めること。`,
  ].join("\n");
}
