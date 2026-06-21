import { prisma } from '@/lib/db';
import { toDateOnly } from '@/lib/dates';
import type { DailyEntry } from '@prisma/client';

// Get (or lazily create) the CRE's DailyEntry for a date. Worklist tap-actions,
// KPI values, tasks and social snapshots all hang off this row.
export async function getOrCreateDailyEntry(userId: string, date: Date): Promise<DailyEntry> {
  const d = toDateOnly(date);
  return prisma.dailyEntry.upsert({
    where: { userId_date: { userId, date: d } },
    update: {},
    create: { userId, date: d },
  });
}

export async function findDailyEntry(userId: string, date: Date): Promise<DailyEntry | null> {
  return prisma.dailyEntry.findUnique({
    where: { userId_date: { userId, date: toDateOnly(date) } },
  });
}
