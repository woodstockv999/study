import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";

export async function POST() {
  try {
    const cache = await fetchAllFeeds();
    return NextResponse.json({ ok: true, count: cache.items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
