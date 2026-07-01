import { NextRequest, NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてから再試行してください。" },
      { status: 429 }
    );
  }

  try {
    const cache = await fetchAllFeeds();
    return NextResponse.json({ ok: true, count: cache.items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
