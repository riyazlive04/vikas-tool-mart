import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/session';
import { computeDashboard, resolveRange } from '@/lib/dashboard';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RangeFilter } from '@/components/dashboard/RangeFilter';
import { ReviewsChart } from '@/components/dashboard/ReviewsChart';
import { SyncStatus } from '@/components/sync/SyncStatus';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  await requireRole(['ADMIN', 'HEAD']);
  const t = await getTranslations('dashboard');

  const range = resolveRange(searchParams.range, searchParams.from, searchParams.to);
  const d = await computeDashboard(range);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-gold">{t('title')}</h1>
        <span className="text-[11px] text-muted">{range.label}</span>
      </div>

      <RangeFilter current={range.key} />
      <SyncStatus />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <MetricCard label={t('avgRating')} value={d.avgRating.value} source={d.avgRating.source} suffix="/10" />
        <MetricCard label={t('reviews')} value={d.reviewsReceived.value} source={d.reviewsReceived.source} accent="success" />
        <MetricCard label={t('complaintsOpen')} value={d.complaintsOpen.value} source={d.complaintsOpen.source} accent="danger" />
        <MetricCard label={t('complaintsClosed')} value={d.complaintsResolved.value} source={d.complaintsResolved.source} accent="success" />
        <MetricCard label={t('new')} value={d.newCustomers.value} source={d.newCustomers.source} />
        <MetricCard label={t('repeat')} value={d.repeatCustomers.value} source={d.repeatCustomers.source} />
        <MetricCard label="Follower growth" value={d.followerGrowth.value} source={d.followerGrowth.source} accent="success" />
      </div>

      <ReviewsChart data={d.reviewsSeries} />

      {/* Accountability */}
      <div className="vtm-card">
        <div className="mb-2 vtm-label">{t('accountability')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-2 font-semibold">CRE</th>
                <th className="py-1 pr-2 font-semibold">{t('submitted')}</th>
                <th className="py-1 pr-2 font-semibold">Tasks %</th>
                <th className="py-1 font-semibold">KPIs</th>
              </tr>
            </thead>
            <tbody>
              {d.accountability.map((a) => (
                <tr key={a.userId} className="border-t border-neutral-800">
                  <td className="py-2 pr-2">
                    <span className="font-semibold">{a.name}</span>
                    <span className="ml-1 text-[10px] text-muted">{a.role}</span>
                  </td>
                  <td className="py-2 pr-2">{a.submittedDays}</td>
                  <td className="py-2 pr-2">{a.tasksPct}%</td>
                  <td className="py-2">{a.kpisFilledAvg}</td>
                </tr>
              ))}
              {d.accountability.length === 0 && (
                <tr><td colSpan={4} className="py-3 text-center text-muted">No staff.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
