import { getTranslations } from 'next-intl/server';
import { requireUser, canManage } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { isoDate } from '@/lib/dates';
import { ReportControls } from '@/components/reports/ReportControls';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await requireUser();
  const t = await getTranslations('reports');
  const manage = canManage(user.role);

  const staff = manage
    ? await prisma.user.findMany({
        where: { active: true, role: { in: ['CRE', 'HEAD'] } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    : [{ id: user.id, name: user.name }];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-gold">{t('title')}</h1>
      <p className="text-xs text-muted">
        Auto-compiled from workbook + sync data. Daily report per CRE, or a management
        summary over a range. Export as PDF or Excel.
      </p>
      <ReportControls canManage={manage} today={isoDate(new Date())} staff={staff} selfId={user.id} />
    </div>
  );
}
