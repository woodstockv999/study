import type { Metadata } from "next";
import { readCache } from "@/lib/cache";
import type { DisclosureCache } from "@/lib/types";
import DisclosureAnalysisPanel from "./DisclosureAnalysisPanel";

interface Props { params: Promise<{ docId: string }>; searchParams: Promise<{ company?: string; desc?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { docId } = await params;
  const sp = await searchParams;
  return { title: sp.desc ?? docId };
}

export default async function DisclosurePage({ params, searchParams }: Props) {
  const { docId } = await params;
  const sp = await searchParams;
  const filerName = sp.company ?? "不明";
  const docDescription = sp.desc ?? docId;

  const cached = readCache<DisclosureCache>(`disclosure/${docId}`);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <div className="bg-navy rounded-xl px-6 py-4">
        <p className="text-xs text-navy-muted mb-1">開示リーダー</p>
        <h1 className="text-lg font-bold text-white">{filerName}</h1>
        <p className="text-sm text-navy-muted mt-0.5">{docDescription}</p>
        <p className="text-2xs text-navy-muted mt-2">文書ID: {docId}</p>
      </div>

      {/* AI解析パネル */}
      <DisclosureAnalysisPanel
        docId={docId}
        filerName={filerName}
        docDescription={docDescription}
        cached={cached}
      />
    </div>
  );
}
