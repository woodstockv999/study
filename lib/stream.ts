// 長時間処理（Web検索ブリーフィング等）でも接続を維持するための
// NDJSON ハートビート・ストリーミング応答ヘルパー（サーバー側）。
//
// iOS Safari は応答データが ~60 秒来ないと fetch を打ち切る（"Load failed"）。
// そこで処理中は 10 秒ごとに {"type":"ping"} を送って接続を生かし、
// 完了時に {"type":"result","data":...}、失敗時に {"type":"error","error":...} を送る。

const PING_INTERVAL_MS = 10_000;

export function ndjsonHeartbeat<T>(work: () => Promise<T>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      // 接続確立直後に即座に送信し、nginx/Safari のタイムアウト前にデータを届ける
      send({ type: "ping" });

      let finished = false;
      const ping = setInterval(() => {
        if (!finished) {
          try {
            send({ type: "ping" });
          } catch {
            /* controller already closed */
          }
        }
      }, PING_INTERVAL_MS);

      try {
        const data = await work();
        finished = true;
        clearInterval(ping);
        send({ type: "result", data });
      } catch (err: any) {
        finished = true;
        clearInterval(ping);
        send({ type: "error", error: err?.message || "処理に失敗しました。" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      // nginx 等のリバースプロキシでのバッファリングを無効化（ping を即時 flush）
      "X-Accel-Buffering": "no",
    },
  });
}
