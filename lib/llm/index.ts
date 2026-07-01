import type { GenerateOptions, LlmProvider } from "./types";
import { generateWithCli } from "./cli";
import { generateWithApi } from "./api";

export type { GenerateOptions, LlmProvider };

function currentProvider(): LlmProvider {
  const p = (process.env.LLM_PROVIDER || "cli").toLowerCase();
  return p === "api" ? "api" : "cli";
}

// 2GB共有VPS上で他アプリと同居するため、生成処理（CLIプロセス起動等）の
// 同時実行数を制限し、連打によるメモリ枯渇を防ぐ。
const MAX_CONCURRENT = 2;
let running = 0;

/**
 * テキスト生成の単一エントリポイント。
 * 各 API ルートはこの関数だけを呼ぶ。プロバイダ切替は LLM_PROVIDER 環境変数。
 */
export async function generate(
  prompt: string,
  opts: GenerateOptions = {}
): Promise<string> {
  if (running >= MAX_CONCURRENT) {
    throw new Error(
      "現在サーバーが混み合っています。しばらくしてから再試行してください。"
    );
  }
  running += 1;
  try {
    const provider = currentProvider();
    const text =
      provider === "api"
        ? await generateWithApi(prompt, opts)
        : await generateWithCli(prompt, opts);

    if (!text) {
      throw new Error("モデルから空の応答が返りました。");
    }
    return text;
  } finally {
    running -= 1;
  }
}

export { currentProvider };
