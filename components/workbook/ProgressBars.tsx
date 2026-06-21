import { getTranslations } from 'next-intl/server';

function Bar({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex-1">
      <div className="mb-1 text-[10px] uppercase text-muted">
        {label} {done}/{total}
      </div>
      <div className="h-1.5 rounded bg-neutral-700">
        <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export async function ProgressBars({
  tasksDone,
  tasksTotal,
  kpisFilled,
  kpisTotal,
}: {
  tasksDone: number;
  tasksTotal: number;
  kpisFilled: number;
  kpisTotal: number;
}) {
  const t = await getTranslations('workbook');
  return (
    <div className="flex gap-3">
      <Bar label={t('tasksProgress')} done={tasksDone} total={tasksTotal} color="#F5C400" />
      <Bar label={t('kpisProgress')} done={kpisFilled} total={kpisTotal} color="#4CAF50" />
    </div>
  );
}
