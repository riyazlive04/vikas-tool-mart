import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { getOrCreateDailyEntry } from '@/lib/workbook/entry';
import { resolveEntryKpis, countFilled } from '@/lib/kpi/service';
import { isoDate, toDateOnly } from '@/lib/dates';
import { dbLabel } from '@/lib/i18n/dbLabel';
import type { AppLocale } from '@/lib/i18n/config';
import { DateNav } from '@/components/ui/DateNav';
import { SyncStatus } from '@/components/sync/SyncStatus';
import { ProgressBars } from '@/components/workbook/ProgressBars';
import { WorkbookClient } from '@/components/workbook/WorkbookClient';

export const dynamic = 'force-dynamic';

export default async function WorkbookPage({ searchParams }: { searchParams: { date?: string } }) {
  const user = await requireUser();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations('nav');

  const today = isoDate(new Date());
  const dateStr = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : today;
  const date = toDateOnly(new Date(dateStr + 'T00:00:00Z'));

  const entry = await getOrCreateDailyEntry(user.id, date);

  const [kpiRows, taskDefs, completions, channels, snapshots] = await Promise.all([
    resolveEntryKpis(entry.id, date),
    prisma.taskDefinition.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.taskCompletion.findMany({ where: { dailyEntryId: entry.id } }),
    prisma.socialChannel.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.socialSnapshot.findMany({ where: { dailyEntryId: entry.id } }),
  ]);

  const doneByTask = new Map(completions.map((c) => [c.taskDefinitionId, c.done]));
  const snapByChannel = new Map(snapshots.map((s) => [s.channelId, s]));

  const kpis = kpiRows.map((r) => ({
    id: r.def.id,
    label: dbLabel(locale, r.def.label, r.def.labelTa),
    type: r.def.type,
    target: r.def.target,
    unit: r.def.unit,
    hasAuto: r.def.autoSource != null,
    value: r.resolved.value,
    source: r.resolved.source,
    overridden: r.resolved.overridden,
    autoValue: r.resolved.autoValue,
  }));

  const tasks = taskDefs.map((d) => ({
    id: d.id,
    label: dbLabel(locale, d.label, d.labelTa),
    done: doneByTask.get(d.id) ?? false,
  }));

  const socials = channels.map((c) => {
    const s = snapByChannel.get(c.id);
    return {
      id: c.id,
      name: c.name,
      yesterdayCount: s?.yesterdayCount ?? null,
      todayCount: s?.todayCount ?? null,
    };
  });

  const tasksDone = tasks.filter((t) => t.done).length;
  const kpisFilled = countFilled(kpiRows);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <DateNav date={dateStr} today={today} />
        <Link
          href={`/worklist?date=${dateStr}`}
          className="min-h-tap rounded-lg bg-card px-3 py-2 text-xs font-bold text-gold"
        >
          → {t('worklist')}
        </Link>
      </div>

      <ProgressBars
        tasksDone={tasksDone}
        tasksTotal={tasks.length}
        kpisFilled={kpisFilled}
        kpisTotal={kpis.length}
      />

      <SyncStatus />

      <WorkbookClient
        date={dateStr}
        submitted={entry.submittedAt != null}
        reflections={{
          achievement: entry.achievement ?? '',
          issues: entry.issues ?? '',
          commitment: entry.commitment ?? '',
          notes: entry.notes ?? '',
        }}
        kpis={kpis}
        tasks={tasks}
        socials={socials}
      />
    </div>
  );
}
