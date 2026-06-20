// LLM バックエンド共通インターフェース。
// briefing/quiz/deepdive の各 API ルートはこの関数だけを呼び、
// 裏側が CLI（サブスク）か API（従量課金）かを意識しない。

export interface GenerateOptions {
  /** Web 検索ツールを使わせるか（briefing のみ true 推奨） */
  webSearch?: boolean;
  /** 生成上限トークン。トークン節約のため必要最小限に。 */
  maxTokens?: number;
}

export type LlmProvider = "cli" | "api";
