import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireUser, canManage } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { isoDate } from '@/lib/dates';
import { ComplaintCard, type ComplaintDTO } from '@/components/complaints/ComplaintCard';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ComplaintsPage({ searchParams }: { searchParams: { status?: string } }) {
  const user = await requireUser();
  const t = await getTranslations('complaints');
  const manage = canManage(user.role);

  const statusFilter = ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(searchParams.status ?? '')
    ? (searchParams.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED')
    : undefined;

  // CRE sees only complaints they logged; Head/Admin see all.
  const where: Prisma.ComplaintWhereInput = {
    ...(manage ? {} : { loggedById: user.id }),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [complaints, assignees] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: [{ status: 'asc' }, { loggedAt: 'desc' }],
      include: { assignedTo: { select: { name: true } }, loggedBy: { select: { name: true } } },
    }),
    manage ? prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }) : Promise.resolve([]),
  ]);

  const dtos: ComplaintDTO[] = complaints.map((c) => ({
    id: c.id,
    customerName: c.customerName,
    customerPhone: c.customerPhone,
    wooOrderRef: c.wooOrderRef,
    category: c.category,
    description: c.description,
    status: c.status,
    assignedToId: c.assignedToId,
    assignedToName: c.assignedTo?.name ?? null,
    loggedByName: c.loggedBy.name,
    loggedAt: isoDate(c.loggedAt),
    followUpAt: c.followUpAt ? isoDate(c.followUpAt) : null,
    resolutionNotes: c.resolutionNotes,
  }));

  const filters: Array<{ key: string; label: string }> = [
    { key: '', label: 'All' },
    { key: 'OPEN', label: t('status.OPEN') },
    { key: 'IN_PROGRESS', label: t('status.IN_PROGRESS') },
    { key: 'RESOLVED', label: t('status.RESOLVED') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-gold">{t('title')}</h1>
        <Link href="/complaints/new" className="min-h-tap rounded-lg bg-gold px-3 py-2 text-xs font-bold text-ink">
          + {t('new')}
        </Link>
      </div>

      <div className="flex gap-1.5">
        {filters.map((f) => {
          const active = (searchParams.status ?? '') === f.key;
          return (
            <Link
              key={f.key}
              href={f.key ? `/complaints?status=${f.key}` : '/complaints'}
              className={`min-h-tap rounded-lg px-3 py-2 text-xs font-bold ${active ? 'bg-gold text-ink' : 'bg-card text-neutral-400'}`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {dtos.length === 0 ? (
        <div className="vtm-card text-center text-sm text-muted">No complaints.</div>
      ) : (
        <div className="space-y-2">
          {dtos.map((c) => (
            <ComplaintCard key={c.id} complaint={c} canManage={manage} assignees={assignees} />
          ))}
        </div>
      )}
    </div>
  );
}
