import Anthropic from "@anthropic-ai/sdk";
import type { GenerateOptions } from "./types";

// ─────────────────────────────────────────────────────────────
//  API プロバイダ（仕様書準拠のフォールバック / Vercel 用）
//  @anthropic-ai/sdk + web_search_20250305 ツール。
//  ※ ANTHROPIC_API_KEY が必要（従量課金）。
// ─────────────────────────────────────────────────────────────

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY が設定されていません（LLM_PROVIDER=api の場合は必須）。"
    );
  }
  return new Anthropic({ apiKey });
}

export async function generateWithApi(
  prompt: string,
  opts: GenerateOptions = {}
): Promise<string> {
  const client = getClient();

  // 仕様書の web_search_20250305 ツール定義。
  // SDK の Tool 型は input_schema を要求するが、サーバーツールは別形のため any で渡す。
  const tools = opts.webSearch
    ? ([
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
          user_location: {
            type: "approximate",
            city: "Tokyo",
            region: "Tokyo",
            country: "JP",
            timezone: "Asia/Tokyo",
          },
        },
      ] as any)
    : undefined;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    ...(tools ? { tools } : {}),
    messages: [{ role: "user", content: prompt }],
  });

  // content は text / server_tool_use / web_search_tool_result 等が混在する。
  // 位置ではなく type === "text" で判定して連結する。
  const text = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  return text.trim();
}
