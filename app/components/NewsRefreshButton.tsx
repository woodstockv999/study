"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props { hasSummaries: boolean }

export default function NewsRefreshButton({ hasSummaries }: Props) {
  const [state, setState] = useState<"idle" | "fetching" | "summarizing">("idle");
  const router = useRouter();

  const refresh = async () => {
    setState("fetching");
    try {
      await fetch("/api/rss/refresh", { method: "POST" });
      setState("summarizing");
      await fetch("/api/rss/summarize", { method: "POST" });
    } finally {
      setState("idle");
      router.refresh();
    }
  };

  const label = state === "fetching" ? "取得中…" : state === "summarizing" ? "AI要約中…" : hasSummaries ? "更新" : "取得 + AI要約";

  return (
    <button
      onClick={refresh}
      disabled={state !== "idle"}
      className="text-xs px-3 py-1.5 rounded bg-navy text-white hover:bg-navy-mid disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}
