import { prisma } from '@/lib/db';
import { resolveEntryKpis } from '@/lib/kpi/service';
import { getOrCreateDailyEntry } from '@/lib/workbook/entry';
import { computeDashboard, type DateRange } from '@/lib/dashboard';
import { isoDate, toDateOnly } from '@/lib/dates';

export type DailyReport = {
  user: { id: string; name: string; role: string };
  date: string;
  submitted: boolean;
  reflections: { achievement: string; issues: string; commitment: string; notes: string };
  kpis: Array<{ label: string; value: number | null; source: string; target: number | null; unit: string | null }>;
  tasks: Array<{ label: string; done: boolean }>;
  social: Array<{ name: string; yesterday: number | null; today: number | null; change: number | null }>;
};

// End-of-day report for one CRE (PRD §10). Auto-compiled from the resolved
// workbook state.
export async function getDailyReport(userId: string, date: Date): Promise<DailyReport> {
  const d = toDateOnly(date);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });
  const entry = await getOrCreateDailyEntry(userId, d);

  const [kpiRows, taskDefs, completions, channels, snapshots] = await Promise.all([
    resolveEntryKpis(entry.id, d),
    prisma.taskDefinition.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.taskCompletion.findMany({ where: { dailyEntryId: entry.id } }),
    prisma.socialChannel.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.socialSnapshot.findMany({ where: { dailyEntryId: entry.id } }),
  ]);

  const doneByTask = new Map(completions.map((c) => [c.taskDefinitionId, c.done]));
  const snapByChannel = new Map(snapshots.map((s) => [s.channelId, s]));

  return {
    user,
    date: isoDate(d),
    submitted: entry.submittedAt != null,
    reflections: {
      achievement: entry.achievement ?? '',
      issues: entry.issues ?? '',
      commitment: entry.commitment ?? '',
      notes: entry.notes ?? '',
    },
    kpis: kpiRows.map((r) => ({
      label: r.def.label,
      value: r.resolved.value,
      source: r.resolved.overridden ? 'EDITED' : r.resolved.source,
      target: r.def.target,
      unit: r.def.unit,
    })),
    tasks: taskDefs.map((t) => ({ label: t.label, done: doneByTask.get(t.id) ?? false })),
    social: channels.map((c) => {
      const s = snapByChannel.get(c.id);
      const y = s?.yesterdayCount ?? null;
      const td = s?.todayCount ?? null;
      return { name: c.name, yesterday: y, today: td, change: y != null && td != null ? td - y : null };
    }),
  };
}

export type SummaryReport = Awaited<ReturnType<typeof computeDashboard>> & { generatedAt: string };

// Weekly/monthly summary (PRD §10) — reuses the dashboard aggregation.
export async function getSummaryReport(range: DateRange): Promise<SummaryReport> {
  const data = await computeDashboard(range);
  return { ...data, generatedAt: isoDate(new Date()) };
}
