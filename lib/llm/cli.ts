import { spawn } from "node:child_process";
import type { GenerateOptions } from "./types";

// ─────────────────────────────────────────────────────────────
//  CLI プロバイダ
//  端末の `claude` を headless（-p / print）モードで起動し、
//  Claude Pro/Max サブスクリプション認証で生成する。
//  → API キー従量課金なしで「Claude チャット経由」のやり取りを実現。
//  Web 検索は Claude Code の WebSearch ツールで賄う。
// ─────────────────────────────────────────────────────────────

const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";
// Web 検索を伴うと数十秒かかるため長めのタイムアウト
const TIMEOUT_MS = Number(process.env.CLAUDE_CLI_TIMEOUT_MS || 240_000);

export async function generateWithCli(
  prompt: string,
  opts: GenerateOptions = {}
): Promise<string> {
  const args = [
    "-p",
    "--output-format",
    "json",
    "--model",
    MODEL,
  ];

  // 必要なツールだけを許可（Web 検索を使う時のみ WebSearch を解放）。
  if (opts.webSearch) {
    args.push("--allowedTools", "WebSearch");
  } else {
    // ツール不要のタスク（quiz/deepdive）は一切のツールを禁止して暴走を防ぐ
    args.push("--allowedTools", "");
  }

  const env = { ...process.env };
  if (process.env.CLAUDE_HOME) env.HOME = process.env.CLAUDE_HOME;

  return await new Promise<string>((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, args, {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("claude CLI がタイムアウトしました（Web検索が長すぎる可能性）。"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(
        new Error(
          `claude CLI を起動できません（${CLAUDE_BIN}）。VPS に Claude Code をインストールしログイン済みか確認してください。詳細: ${err.message}`
        )
      );
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(
            `claude CLI が異常終了しました (exit ${code})。${stderr.slice(0, 500)}`
          )
        );
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        const text: string =
          parsed.result ?? parsed.text ?? parsed.content ?? "";
        if (parsed.is_error) {
          reject(new Error(`claude CLI エラー: ${text || "unknown"}`));
          return;
        }
        resolve(String(text).trim());
      } catch {
        // JSON で無い場合は素のテキストとして返す（保険）
        resolve(stdout.trim());
      }
    });

    // プロンプトは stdin 経由で渡す（引数長・エスケープ問題を回避）
    child.stdin.write(prompt);
    child.stdin.end();
  });
}
