// アプリのベースパス（マルチアプリのポータル配下で動かす場合に使用）。
// next.config.mjs の basePath と一致させる。未設定ならルート("")。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** API ルート等への絶対パスを basePath 付きで組み立てる。 */
export function apiUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * バックグラウンドジョブを開始し、jobId を返す。
 * サーバー側は Safari が閉じても処理を継続する。
 */
export async function startJob(path: string, body: unknown): Promise<string> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("通信に失敗しました。ネットワーク接続を確認してください。");
  }
  if (!res.ok) {
    let message = "通信に失敗しました。";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  const { jobId } = await res.json();
  return jobId as string;
}

const POLL_INTERVAL_MS = 3_000;
// ジョブの有効期限（1時間）に余裕をもたせた最大ポーリング時間
const POLL_MAX_MS = 55 * 60 * 1000;

/**
 * ステータスエンドポイントを定期的に叩き、ジョブ完了まで待って data を返す。
 * Safari を閉じた後に再開しても、jobId が残っていれば続きからポーリングできる。
 */
export async function pollJob<T>(
  statusPath: string,
  jobId: string,
  signal?: AbortSignal
): Promise<T> {
  const deadline = Date.now() + POLL_MAX_MS;

  while (Date.now() < deadline) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));

    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    let res: Response;
    try {
      res = await fetch(
        apiUrl(`${statusPath}?jobId=${encodeURIComponent(jobId)}`),
        { signal }
      );
    } catch (e: any) {
      if (e?.name === "AbortError") throw e;
      continue; // ネットワーク一時エラーはスキップして再試行
    }

    if (res.status === 404) {
      throw new Error("処理結果が見つかりません。もう一度作成してください。");
    }
    if (!res.ok) continue; // 一時的なサーバーエラーはスキップ

    const job = await res.json();
    if (job.status === "done") return job.data as T;
    if (job.status === "error") throw new Error(job.error || "処理に失敗しました。");
    // "pending" → 次のループへ
  }

  throw new Error("タイムアウトしました。もう一度お試しください。");
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
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Safari: "Load failed" / Chrome: "Failed to fetch" などネットワーク系エラー
    throw new Error("通信が中断されました。ネットワーク接続を確認してから再試行してください。");
  }

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

  try {
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
  } catch (e: any) {
    // result が確定済みならストリーム末尾の切断は無視
    if (result !== undefined) return result;
    // Safari がバックグラウンドで接続を切った場合等
    throw new Error("通信が途中で中断されました。再試行してください。");
  }

  if (result === undefined) {
    throw new Error("応答が不完全でした。もう一度お試しください。");
  }
  return result;
}
