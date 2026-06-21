import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { getOrCreateDailyEntry } from '@/lib/workbook/entry';
import { dayRange, isoDate, toDateOnly } from '@/lib/dates';
import { DateNav } from '@/components/ui/DateNav';
import { SyncStatus } from '@/components/sync/SyncStatus';
import { WorklistClient, type WorklistOrder } from '@/components/worklist/WorklistClient';

export const dynamic = 'force-dynamic';

type ActionType = 'CONTACTED' | 'REVIEW_REQ' | 'UNBOXING_REQ' | 'TESTIMONIAL_REQ';

export default async function WorklistPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const user = await requireUser();
  const t = await getTranslations('worklist');

  const today = isoDate(new Date());
  const dateStr = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : today;
  const date = toDateOnly(new Date(dateStr + 'T00:00:00Z'));

  const entry = await getOrCreateDailyEntry(user.id, date);
  const { start, end } = dayRange(date);

  const orders = await prisma.wooOrder.findMany({
    where: { dateCreated: { gte: start, lt: end } },
    orderBy: { dateCreated: 'desc' },
  });

  const actions = orders.length
    ? await prisma.orderAction.findMany({
        where: { dailyEntryId: entry.id, wooOrderId: { in: orders.map((o) => o.id) } },
      })
    : [];

  const actionsByOrder = new Map<string, ActionType[]>();
  for (const a of actions) {
    const list = actionsByOrder.get(a.wooOrderId) ?? [];
    list.push(a.action as ActionType);
    actionsByOrder.set(a.wooOrderId, list);
  }

  const rows: WorklistOrder[] = orders.map((o) => ({
    id: o.id,
    number: o.number,
    customerName: o.customerName,
    total: o.total,
    status: o.status,
    actions: actionsByOrder.get(o.id) ?? [],
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-extrabold text-gold">{t('title')}</h1>
        <span className="text-xs text-muted">{rows.length} orders</span>
      </div>

      <DateNav date={dateStr} today={today} />
      <SyncStatus />

      <WorklistClient orders={rows} date={dateStr} />
    </div>
  );
}
