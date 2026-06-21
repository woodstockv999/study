// アプリのベースパス（マルチアプリのポータル配下で動かす場合に使用）。
// next.config.mjs の basePath と一致させる。未設定ならルート("")。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** API ルート等への絶対パスを basePath 付きで組み立てる。 */
export function apiUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * NDJSON ハートビート・ストリーミング応答を受け取り、最終 result を返す。
 * ping 行は無視し、result/error を解釈する。
 * （長時間処理でも接続が切れない＝iOS Safari の ~60 秒打ち切り対策）
 */
export async function postStream<T = any>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // 入力検証エラー等（ストリーム前の 4xx/5xx）は通常の JSON で返る
  if (!res.ok || !res.body) {
    let message = "通信に失敗しました。";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | undefined;

  // NDJSON を行単位で処理
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;

      let msg: any;
      try {
        msg = JSON.parse(line);
      } catch {
        continue; // 不完全な行は読み飛ばす
      }

      if (msg.type === "result") result = msg.data as T;
      else if (msg.type === "error") throw new Error(msg.error || "処理に失敗しました。");
      // type === "ping" は無視
    }
  }

  if (result === undefined) {
    throw new Error("応答が不完全でした。もう一度お試しください。");
  }
  return result;
}
