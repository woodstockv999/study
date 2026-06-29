interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div className={`bg-paper-surface border rounded-lg p-4 ${accent ? "border-accent/30 bg-accent-soft" : "border-paper-border"}`}>
      <p className="text-2xs text-ink-faint uppercase tracking-wider font-bold">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent ? "text-accent" : "text-ink"}`}>{value}</p>
      {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
    </div>
  );
}
