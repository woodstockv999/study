import { XMLParser } from "fast-xml-parser";
import type { RssItem, RssCache } from "./types";
import { readCache, writeCache, isFresh } from "./cache";

export const RSS_FEEDS = [
  { url: "https://www3.nhk.or.jp/rss/news/cat6.xml",            source: "NHK経済" },
  { url: "https://www3.nhk.or.jp/rss/news/cat5.xml",            source: "NHK社会" },
  { url: "https://www3.nhk.or.jp/rss/news/cat9.xml",            source: "NHK国際" },
  { url: "https://rss.itmedia.co.jp/rss/2.0/itmedia_news.xml",  source: "ITmedia" },
  { url: "https://gigazine.net/news/rss_2.0/",                   source: "GIGAZINE" },
  { url: "https://feeds.reuters.com/reuters/JPbusinessNews",     source: "Reuters" },
];

const CACHE_KEY = "rss/items";
const FETCH_TTL = 60; // minutes

export async function getRssItems(forceRefresh = false): Promise<RssCache> {
  if (!forceRefresh) {
    const cached = readCache<RssCache>(CACHE_KEY);
    if (cached && isFresh(cached.fetchedAt, FETCH_TTL)) return cached;
  }
  return fetchAllFeeds();
}

export async function fetchAllFeeds(): Promise<RssCache> {
  const parser = new XMLParser({ ignoreAttributes: false, textNodeName: "#text" });

  const results = await Promise.allSettled(
    RSS_FEEDS.map(({ url, source }) =>
      fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; InfoBot/1.0)" },
        signal: AbortSignal.timeout(8000),
      })
        .then((r) => r.text())
        .then((xml) => parseFeed(parser, xml, source))
        .catch(() => [] as RssItem[])
    )
  );

  const items: RssItem[] = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 80);

  const cache: RssCache = { items, fetchedAt: new Date().toISOString() };
  writeCache(CACHE_KEY, cache);
  return cache;
}

function parseFeed(parser: XMLParser, xml: string, source: string): RssItem[] {
  try {
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel ?? parsed?.feed;
    if (!channel) return [];

    const rawItems = channel.item ?? channel.entry ?? [];
    const arr: any[] = Array.isArray(rawItems) ? rawItems : [rawItems];

    return arr.slice(0, 15).map((item: any, i: number) => ({
      id: `${source}-${i}-${item.pubDate ?? item.updated ?? i}`,
      title:       stripHtml(str(item.title)),
      description: stripHtml(str(item.description ?? item.summary ?? item["content:encoded"] ?? "")),
      link:        str(item.link ?? item.id ?? ""),
      pubDate:     str(item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString()),
      source,
    }));
  } catch {
    return [];
  }
}

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "#text" in v) return String((v as any)["#text"]);
  return String(v ?? "");
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ").trim()
    .slice(0, 400);
}
