// サーバー側インメモリジョブストア。
// Node.js (PM2) プロセスが維持される限り有効。1時間後に自動削除。

export type JobStatus = "pending" | "done" | "error";

interface Job {
  status: JobStatus;
  data?: unknown;
  error?: string;
  createdAt: number;
}

const store = new Map<string, Job>();

// 1時間経過したジョブを定期削除
const timer = setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of store) {
    if (job.createdAt < cutoff) store.delete(id);
  }
}, 10 * 60 * 1000);
// Node.js の場合、タイマーがプロセス終了を阻まないよう unref
if (typeof timer === "object" && "unref" in timer) (timer as any).unref();

export function createJob(): string {
  const id = crypto.randomUUID();
  store.set(id, { status: "pending", createdAt: Date.now() });
  return id;
}

export function resolveJob(id: string, data: unknown): void {
  const job = store.get(id);
  if (job) Object.assign(job, { status: "done", data });
}

export function rejectJob(id: string, error: string): void {
  const job = store.get(id);
  if (job) Object.assign(job, { status: "error", error });
}

export function getJob(id: string): Pick<Job, "status" | "data" | "error"> | undefined {
  const job = store.get(id);
  if (!job) return undefined;
  return { status: job.status, data: job.data, error: job.error };
}
