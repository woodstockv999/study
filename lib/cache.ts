import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_\-]/g, "_");
}

function keyToPath(key: string): string {
  // Sanitize every segment (not just the filename) so a "/" or ".." smuggled
  // in via a dynamic route param (e.g. disclosure/[docId]) can't escape DATA_DIR.
  const parts = key.split("/").filter(Boolean).map(sanitizeSegment);
  const dir = parts.slice(0, -1);
  const file = parts[parts.length - 1] ?? "cache";
  const resolved = path.resolve(DATA_DIR, ...dir, `${file}.json`);
  if (resolved !== DATA_DIR && !resolved.startsWith(DATA_DIR + path.sep)) {
    throw new Error("Invalid cache key");
  }
  return resolved;
}

export function readCache<T>(key: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(keyToPath(key), "utf-8")) as T;
  } catch {
    return null;
  }
}

export function writeCache(key: string, data: unknown): void {
  const file = keyToPath(key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export function deleteCache(key: string): void {
  try { fs.unlinkSync(keyToPath(key)); } catch {}
}

export function isFresh(timestamp: string, ttlMinutes: number): boolean {
  return Date.now() - new Date(timestamp).getTime() < ttlMinutes * 60 * 1000;
}
