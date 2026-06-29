// localStorage ラッパー（履歴・設定）。クライアント専用。

import type { Level } from "./prompts";

export interface BriefingRecord {
  id: string;
  date: string; // ISO 文字列
  industry: string;
  level: Level;
  text: string;
  starred?: boolean;
}

const HISTORY_KEY = "briefing.history.v1";
const SETTINGS_KEY = "briefing.settings.v1";

export interface Settings {
  industry: string;
  customIndustry: string;
  level: Level;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadHistory(): BriefingRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse<BriefingRecord[]>(localStorage.getItem(HISTORY_KEY), []);
}

export function saveHistory(records: BriefingRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

export function addBriefing(
  rec: Omit<BriefingRecord, "id" | "date">
): BriefingRecord[] {
  const record: BriefingRecord = {
    ...rec,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
    date: new Date().toISOString(),
  };
  const next = [record, ...loadHistory()].slice(0, 100);
  saveHistory(next);
  return next;
}

export function deleteBriefing(id: string): BriefingRecord[] {
  const next = loadHistory().filter((r) => r.id !== id);
  saveHistory(next);
  return next;
}

export function toggleStar(id: string): BriefingRecord[] {
  const next = loadHistory().map((r) =>
    r.id === id ? { ...r, starred: !r.starred } : r
  );
  saveHistory(next);
  return next;
}

export function loadSettings(): Settings | null {
  if (typeof window === "undefined") return null;
  return safeParse<Settings | null>(localStorage.getItem(SETTINGS_KEY), null);
}

export function saveSettings(s: Settings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
