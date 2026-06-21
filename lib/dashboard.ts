import { prisma } from '@/lib/db';
import { avgRatingScaled, classifyCustomers, type CustomerLite, type OrderLite } from '@/lib/kpi/compute';
import { isoDate } from '@/lib/dates';

export type RangeKey = 'today' | 'week' | 'month' | 'custom';

export type DateRange = { start: Date; end: Date; key: RangeKey; label: string };

// Resolve a range from a key (+optional custom from/to). end is exclusive.
export function resolveRange(key: string | undefined, from?: string, to?: string): DateRange {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayMs = 24 * 60 * 60 * 1000;
  const endOfToday = new Date(todayStart.getTime() + dayMs);

  if (key === 'custom' && from && to) {
    const start = new Date(from + 'T00:00:00Z');
    const end = new Date(new Date(to + 'T00:00:00Z').getTime() + dayMs);
    return { start, end, key: 'custom', label: `${from} → ${to}` };
  }
  if (key === 'week') return { start: new Date(endOfToday.getTime() - 7 * dayMs), end: endOfToday, key: 'week', label: 'Last 7 days' };
  if (key === 'month') return { start: new Date(endOfToday.getTime() - 30 * dayMs), end: endOfToday, key: 'month', label: 'Last 30 days' };
  return { start: todayStart, end: endOfToday, key: 'today', label: 'Today' };
}

export type Metric = { value: number | null; source: 'AUTO' | 'MANUAL' };

export type DashboardData = {
  range: DateRange;
  avgRating: Metric;
  reviewsReceived: Metric;
  complaintsOpen: Metric;
  complaintsResolved: Metric;
  newCustomers: Metric;
  repeatCustomers: Metric;
  followerGrowth: Metric;
  reviewsSeries: Array<{ date: string; count: number }>;
  accountability: Array<{
    userId: string;
    name: string;
    role: string;
    submittedDays: number;
    tasksPct: number;
    kpisFilledAvg: number;
  }>;
};

export async function computeDashboard(range: DateRange): Promise<DashboardData> {
  const { start, end } = range;

  const [allReviews, reviewsInRange, openComplaints, resolvedComplaints, orders, snapshots, kpiDefs, taskTotal] =
    await Promise.all([
      prisma.wooReview.findMany({ where: { source: 'WOO_CUSREV' }, select: { rating: true } }),
      prisma.wooReview.findMany({ where: { dateCreated: { gte: start, lt: end } }, select: { dateCreated: true } }),
      prisma.complaint.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.complaint.count({ where: { status: 'RESOLVED', resolvedAt: { gte: start, lt: end } } }),
      prisma.wooOrder.findMany({ where: { dateCreated: { gte: start, lt: end } }, select: { customerWooId: true, dateCreated: true } }),
      prisma.socialSnapshot.findMany({
        where: { dailyEntry: { date: { gte: start, lt: end } } },
        select: { yesterdayCount: true, todayCount: true },
      }),
      prisma.kpiDefinition.findMany({ where: { active: true }, select: { id: true, autoSource: true } }),
      prisma.taskDefinition.count({ where: { active: true } }),
    ]);

  // Customers: new vs repeat across the range.
  const ids = orders.map((o) => o.customerWooId).filter((v): v is number => v != null && v !== 0);
  const customers = ids.length
    ? await prisma.wooCustomer.findMany({ where: { wooId: { in: ids } }, select: { wooId: true, firstOrderDate: true, isRepeat: true } })
    : [];
  const map = new Map<number, CustomerLite>(customers.map((c) => [c.wooId, c]));
  const { newCount, repeatCount } = classifyCustomers(orders as OrderLite[], map, start);

  // Follower growth: sum of (today - yesterday) where both present (MANUAL).
  let growth = 0;
  let hasGrowth = false;
  for (const s of snapshots) {
    if (s.todayCount != null && s.yesterdayCount != null) {
      growth += s.todayCount - s.yesterdayCount;
      hasGrowth = true;
    }
  }

  // Reviews per day series.
  const seriesMap = new Map<string, number>();
  for (const r of reviewsInRange) {
    const d = isoDate(r.dateCreated);
    seriesMap.set(d, (seriesMap.get(d) ?? 0) + 1);
  }
  const reviewsSeries = Array.from(seriesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Accountability per CRE/HEAD.
  const autoKpiCount = kpiDefs.filter((k) => k.autoSource != null).length;
  const manualKpiIds = new Set(kpiDefs.filter((k) => k.autoSource == null).map((k) => k.id));
  const kpiTotal = kpiDefs.length;

  const staff = await prisma.user.findMany({
    where: { active: true, role: { in: ['CRE', 'HEAD'] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });

  const entries = await prisma.dailyEntry.findMany({
    where: { date: { gte: start, lt: end }, userId: { in: staff.map((s) => s.id) } },
    include: {
      taskCompletions: { where: { done: true }, select: { id: true } },
      kpiValues: { select: { kpiDefinitionId: true, manualValue: true } },
    },
  });
  const entriesByUser = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = entriesByUser.get(e.userId) ?? [];
    list.push(e);
    entriesByUser.set(e.userId, list);
  }

  const accountability = staff.map((s) => {
    const list = entriesByUser.get(s.id) ?? [];
    const submittedDays = list.filter((e) => e.submittedAt != null).length;
    const tasksPctVals = list.map((e) => (taskTotal > 0 ? (e.taskCompletions.length / taskTotal) * 100 : 0));
    const kpiFilledVals = list.map((e) => {
      const manualFilled = e.kpiValues.filter((v) => manualKpiIds.has(v.kpiDefinitionId) && v.manualValue != null).length;
      return autoKpiCount + manualFilled;
    });
    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
    return {
      userId: s.id,
      name: s.name,
      role: s.role,
      submittedDays,
      tasksPct: avg(tasksPctVals),
      kpisFilledAvg: list.length ? avg(kpiFilledVals) : 0,
    };
  });

  return {
    range,
    avgRating: { value: avgRatingScaled(allReviews.map((r) => r.rating)), source: 'AUTO' },
    reviewsReceived: { value: reviewsInRange.length, source: 'AUTO' },
    complaintsOpen: { value: openComplaints, source: 'AUTO' },
    complaintsResolved: { value: resolvedComplaints, source: 'AUTO' },
    newCustomers: { value: newCount, source: 'AUTO' },
    repeatCustomers: { value: repeatCount, source: 'AUTO' },
    followerGrowth: { value: hasGrowth ? growth : null, source: 'MANUAL' },
    reviewsSeries,
    accountability: accountability.map((a) => ({ ...a, kpisFilledAvg: a.kpisFilledAvg })),
  };
}

export const KPI_TOTAL_NOTE = 'kpisFilledAvg is out of the active KPI count';
