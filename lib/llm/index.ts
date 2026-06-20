import type { GenerateOptions, LlmProvider } from "./types";
import { generateWithCli } from "./cli";
import { generateWithApi } from "./api";

export type { GenerateOptions, LlmProvider };

function currentProvider(): LlmProvider {
  const p = (process.env.LLM_PROVIDER || "cli").toLowerCase();
  return p === "api" ? "api" : "cli";
}

/**
 * テキスト生成の単一エントリポイント。
 * 各 API ルートはこの関数だけを呼ぶ。プロバイダ切替は LLM_PROVIDER 環境変数。
 */
export async function generate(
  prompt: string,
  opts: GenerateOptions = {}
): Promise<string> {
  const provider = currentProvider();
  const text =
    provider === "api"
      ? await generateWithApi(prompt, opts)
      : await generateWithCli(prompt, opts);

  if (!text) {
    throw new Error("モデルから空の応答が返りました。");
  }
  return text;
}

export { currentProvider };
