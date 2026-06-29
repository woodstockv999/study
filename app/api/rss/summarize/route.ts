import { NextResponse } from "next/server";
import { getRssItems } from "@/lib/rss";
import { writeCache, readCache } from "@/lib/cache";
import { generate } from "@/lib/llm";
import { buildRssSummaryPrompt } from "@/lib/prompts";
import type { RssCache, RssItem } from "@/lib/types";

export async function POST() {
  try {
    const rss = await getRssItems();
    const unsummarized = rss.items.filter((i) => !i.summary).slice(0, 20);
    if (!unsummarized.length) return NextResponse.json({ ok: true, skipped: true });

    const prompt = buildRssSummaryPrompt(unsummarized);
    const text = await generate(prompt, { maxTokens: 2000 });

    // JSON抽出
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ ok: false, error: "JSON not found" });

    const summaries: { index: number; summary: string; importance: number; tags: string[] }[] = JSON.parse(match[0]);

    const updated: RssItem[] = rss.items.map((item, idx) => {
      const found = summaries.find((s) => {
        const origIdx = unsummarized.indexOf(item);
        return origIdx !== -1 && s.index === origIdx;
      });
      return found ? { ...item, summary: found.summary, importance: found.importance, tags: found.tags } : item;
    });

    const newCache: RssCache = { ...rss, items: updated, summarizedAt: new Date().toISOString() };
    writeCache("rss/items", newCache);
    return NextResponse.json({ ok: true, count: summaries.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
