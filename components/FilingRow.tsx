import Link from "next/link";
import type { Filing } from "@/lib/types";
import { formatSubmitDate, DOC_TYPE_COLOR } from "@/lib/format";

export default function FilingRow({ filing }: { filing: Filing }) {
  const colorCls = DOC_TYPE_COLOR[filing.docType] ?? "bg-ink-mid text-white";
  return (
    <div className="flex items-start gap-3 py-3 hover:bg-paper transition-colors px-1">
      <span className={`shrink-0 mt-0.5 text-2xs font-bold px-1.5 py-0.5 rounded ${colorCls}`}>
        {filing.docTypeLabel}
      </span>
      <div className="flex-1 min-w-0">
        <Link
          href={`/company/${filing.edinetCode}`}
          className="text-sm font-semibold text-ink hover:text-accent transition-colors truncate block"
        >
          {filing.filerName}
        </Link>
        <p className="text-xs text-ink-muted truncate">{filing.docDescription}</p>
      </div>
      <span className="text-2xs text-ink-faint tabular-nums shrink-0 mt-0.5">
        {formatSubmitDate(filing.submitDateTime)}
      </span>
    </div>
  );
}
