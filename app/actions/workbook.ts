'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { getOrCreateDailyEntry } from '@/lib/workbook/entry';
import { audit } from '@/lib/audit';

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(dateRe);

export type Ok = { ok: true } | { ok: false; error: string };

function bad(msg = 'Invalid input'): Ok {
  return { ok: false, error: msg };
}

// ── Reflections (achievement / issues / commitment / notes) ──
const reflectionsSchema = z.object({
  date: dateField,
  achievement: z.string().max(4000).optional().nullable(),
  issues: z.string().max(4000).optional().nullable(),
  commitment: z.string().max(4000).optional().nullable(),
  notes: z.string().max(8000).optional().nullable(),
});

export async function saveReflections(input: unknown): Promise<Ok> {
  const user = await requireUser();
  const p = reflectionsSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const { date, ...fields } = p.data;
  const entry = await getOrCreateDailyEntry(user.id, new Date(date));
  await prisma.dailyEntry.update({ where: { id: entry.id }, data: fields });
  revalidatePath('/workbook');
  return { ok: true };
}

// ── KPI value (manual entry or override of an auto KPI) ──
const kpiSchema = z.object({
  date: dateField,
  kpiDefinitionId: z.string().min(1),
  // null clears the manual value (auto KPIs revert to AUTO; manual KPIs go empty)
  value: z.number().finite().nullable(),
});

export async function setKpiValue(input: unknown): Promise<Ok> {
  const user = await requireUser();
  const p = kpiSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const { date, kpiDefinitionId, value } = p.data;

  const def = await prisma.kpiDefinition.findUnique({ where: { id: kpiDefinitionId } });
  if (!def) return bad('Unknown KPI');

  const entry = await getOrCreateDailyEntry(user.id, new Date(date));
  const isAuto = def.autoSource != null;
  const clearing = value === null;

  // Override metadata only applies when a manual value overrides an auto KPI.
  const overrode = isAuto && !clearing;

  await prisma.kpiValue.upsert({
    where: { dailyEntryId_kpiDefinitionId: { dailyEntryId: entry.id, kpiDefinitionId } },
    update: {
      manualValue: value,
      source: clearing ? (isAuto ? 'AUTO' : 'MANUAL') : 'MANUAL',
      overriddenById: overrode ? user.id : null,
      overriddenAt: overrode ? new Date() : null,
    },
    create: {
      dailyEntryId: entry.id,
      kpiDefinitionId,
      manualValue: value,
      source: clearing ? (isAuto ? 'AUTO' : 'MANUAL') : 'MANUAL',
      overriddenById: overrode ? user.id : null,
      overriddenAt: overrode ? new Date() : null,
    },
  });

  await audit({
    userId: user.id,
    action: clearing ? 'kpi.clear' : isAuto ? 'kpi.override' : 'kpi.set',
    entity: 'KpiValue',
    entityId: kpiDefinitionId,
    meta: { date, value },
  });

  revalidatePath('/workbook');
  return { ok: true };
}

// ── Task completion ──
const taskSchema = z.object({
  date: dateField,
  taskDefinitionId: z.string().min(1),
  done: z.boolean(),
});

export async function toggleTask(input: unknown): Promise<Ok> {
  const user = await requireUser();
  const p = taskSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const { date, taskDefinitionId, done } = p.data;
  const entry = await getOrCreateDailyEntry(user.id, new Date(date));
  await prisma.taskCompletion.upsert({
    where: { dailyEntryId_taskDefinitionId: { dailyEntryId: entry.id, taskDefinitionId } },
    update: { done },
    create: { dailyEntryId: entry.id, taskDefinitionId, done },
  });
  revalidatePath('/workbook');
  return { ok: true };
}

// ── Social snapshot ──
const socialSchema = z.object({
  date: dateField,
  channelId: z.string().min(1),
  yesterdayCount: z.number().int().min(0).nullable(),
  todayCount: z.number().int().min(0).nullable(),
});

export async function setSocialSnapshot(input: unknown): Promise<Ok> {
  const user = await requireUser();
  const p = socialSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const { date, channelId, yesterdayCount, todayCount } = p.data;
  const entry = await getOrCreateDailyEntry(user.id, new Date(date));
  await prisma.socialSnapshot.upsert({
    where: { dailyEntryId_channelId: { dailyEntryId: entry.id, channelId } },
    update: { yesterdayCount, todayCount, source: 'MANUAL' },
    create: { dailyEntryId: entry.id, channelId, yesterdayCount, todayCount, source: 'MANUAL' },
  });
  revalidatePath('/workbook');
  return { ok: true };
}

// ── Submit (mark the day's entry as submitted) ──
export async function submitEntry(input: unknown): Promise<Ok> {
  const user = await requireUser();
  const p = z.object({ date: dateField }).safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const entry = await getOrCreateDailyEntry(user.id, new Date(p.data.date));
  await prisma.dailyEntry.update({ where: { id: entry.id }, data: { submittedAt: new Date() } });
  await audit({ userId: user.id, action: 'workbook.submit', entity: 'DailyEntry', entityId: entry.id });
  revalidatePath('/workbook');
  revalidatePath('/dashboard');
  return { ok: true };
}
