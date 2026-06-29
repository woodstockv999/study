/** 百万円 → "4,200億円" or "12.3兆円" */
export function formatJPY(million: number | undefined | null): string {
  if (million == null) return "—";
  const abs = Math.abs(million);
  const sign = million < 0 ? "▲" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}兆円`;
  if (abs >= 10_000)    return `${sign}${Math.round(abs / 100).toLocaleString()}億円`;
  if (abs >= 100)       return `${sign}${(abs / 100).toFixed(1)}億円`;
  return `${sign}${abs.toLocaleString()}百万円`;
}

/** 百万円 → 億円（チャート用） */
export function toOku(million: number): number {
  return Math.round(million / 100) / 10;
}

/** 利益率 */
export function formatRate(rate: number | undefined | null): string {
  if (rate == null) return "—";
  return `${rate.toFixed(1)}%`;
}

/** 前年比テキスト */
export function yoyLabel(current: number, prev?: number): string {
  if (!prev) return "";
  const pct = ((current - prev) / Math.abs(prev)) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

/** submitDateTime を "M/D HH:mm" */
export function formatSubmitDate(dt: string): string {
  const d = new Date(dt);
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** ISO日付を "M月D日" */
export function formatPubDate(dt: string): string {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return `${Math.round(diffH * 60)}分前`;
  if (diffH < 24) return `${Math.round(diffH)}時間前`;
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

/** 株式数（千株） → 読みやすい形式 */
export function formatShares(thousands: number): string {
  if (thousands >= 100_000) return `${(thousands / 100_000).toFixed(1)}千万株`;
  if (thousands >= 10_000)  return `${(thousands / 10_000).toFixed(1)}百万株`;
  if (thousands >= 1_000)   return `${(thousands / 1_000).toFixed(1)}万株`;
  return `${thousands.toLocaleString()}千株`;
}

export const DOC_TYPE_LABEL: Record<number, string> = {
  2: "有価証券報告書", 3: "半期報告書", 4: "四半期報告書",
  5: "臨時報告書", 10: "有価証券届出書", 120: "大量保有報告書", 121: "大量保有変更報告書",
};

export const DOC_TYPE_COLOR: Record<number, string> = {
  2: "bg-navy text-white", 3: "bg-navy-mid text-white", 4: "bg-navy-mid text-white",
  5: "bg-ink-mid text-white", 10: "bg-ink text-white",
  120: "bg-accent text-white", 121: "bg-accent text-white",
};
