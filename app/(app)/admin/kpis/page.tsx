import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { KpiManager } from '@/components/admin/KpiManager';

export const dynamic = 'force-dynamic';

export default async function AdminKpisPage() {
  await requireRole(['ADMIN']);
  const kpis = await prisma.kpiDefinition.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-gold">KPIs</h1>
      <KpiManager kpis={kpis.map((k) => ({
        id: k.id, key: k.key, label: k.label, labelTa: k.labelTa, type: k.type,
        target: k.target, autoSource: k.autoSource, unit: k.unit, active: k.active,
      }))} />
    </div>
  );
}
