import { SourceTag } from '@/components/ui/SourceTag';

export function MetricCard({
  label,
  value,
  source,
  suffix,
  accent,
}: {
  label: string;
  value: number | null;
  source: 'AUTO' | 'MANUAL';
  suffix?: string;
  accent?: 'gold' | 'success' | 'danger';
}) {
  const color = accent === 'success' ? 'text-success' : accent === 'danger' ? 'text-danger' : 'text-gold';
  return (
    <div className="vtm-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">{label}</span>
        <SourceTag source={source} />
      </div>
      <div className={`mt-1 text-2xl font-extrabold ${color}`}>
        {value == null ? '—' : value.toLocaleString('en-IN')}
        {value != null && suffix ? <span className="text-sm font-bold text-muted"> {suffix}</span> : null}
      </div>
    </div>
  );
}
