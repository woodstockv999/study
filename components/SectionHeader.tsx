interface Props {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, sub, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className="w-0.5 h-4 bg-accent rounded-sm" />
        <div>
          <h2 className="text-sm font-bold text-ink uppercase tracking-wide">{title}</h2>
          {sub && <p className="text-xs text-ink-muted">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
