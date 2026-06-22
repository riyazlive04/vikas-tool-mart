'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { audit } from '@/lib/audit';

export type CfgResult = { ok: true } | { ok: false; error: string };
const bad = (error = 'Invalid input'): CfgResult => ({ ok: false, error });

const KPI_TYPES = ['NUMBER', 'COUNT', 'CHECK', 'RATING'] as const;
const AUTO_SOURCES = [
  'WOO_NEW_CUSTOMERS', 'WOO_REPEAT_CUSTOMERS', 'WOO_ONSITE_REVIEWS', 'WOO_AVG_RATING',
  'DERIVED_COMPLAINTS_LOGGED', 'DERIVED_COMPLAINTS_ASSIGNED',
  'WORKLIST_CONTACTED', 'WORKLIST_REVIEW_REQ', 'WORKLIST_UNBOXING_REQ', 'WORKLIST_TESTIMONIAL_REQ',
] as const;

// ─────────────── KPI definitions ───────────────
const kpiSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(2).regex(/^[a-z0-9_]+$/, 'lowercase letters/numbers/underscore only'),
  label: z.string().min(2),
  labelTa: z.string().optional().nullable(),
  type: z.enum(KPI_TYPES),
  target: z.number().finite().nullable().optional(),
  autoSource: z.enum(AUTO_SOURCES).nullable().optional(),
  unit: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function saveKpi(input: unknown): Promise<CfgResult> {
  const user = await requireRole(['ADMIN']);
  const p = kpiSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const { id, ...data } = p.data;
  const payload = {
    key: data.key,
    label: data.label,
    labelTa: data.labelTa || null,
    type: data.type,
    target: data.target ?? null,
    autoSource: data.autoSource ?? null,
    unit: data.unit || null,
    active: data.active ?? true,
  };
  try {
    if (id) {
      await prisma.kpiDefinition.update({ where: { id }, data: payload });
    } else {
      const max = await prisma.kpiDefinition.aggregate({ _max: { sortOrder: true } });
      await prisma.kpiDefinition.create({ data: { ...payload, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
    }
  } catch (e) {
    return bad('Key must be unique');
  }
  await audit({ userId: user.id, action: id ? 'kpi.def.update' : 'kpi.def.create', entity: 'KpiDefinition', entityId: id ?? data.key });
  revalidatePath('/admin/kpis');
  revalidatePath('/workbook');
  return { ok: true };
}

// ─────────────── Task definitions ───────────────
const taskSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(2),
  labelTa: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function saveTask(input: unknown): Promise<CfgResult> {
  const user = await requireRole(['ADMIN']);
  const p = taskSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const { id, label, labelTa, active } = p.data;
  const payload = { label, labelTa: labelTa || null, active: active ?? true };
  if (id) {
    await prisma.taskDefinition.update({ where: { id }, data: payload });
  } else {
    const max = await prisma.taskDefinition.aggregate({ _max: { sortOrder: true } });
    await prisma.taskDefinition.create({ data: { ...payload, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  }
  await audit({ userId: user.id, action: id ? 'task.def.update' : 'task.def.create', entity: 'TaskDefinition', entityId: id });
  revalidatePath('/admin/tasks');
  revalidatePath('/workbook');
  return { ok: true };
}

// ─────────────── Social channels ───────────────
const channelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  platform: z.string().min(2),
  handle: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function saveChannel(input: unknown): Promise<CfgResult> {
  const user = await requireRole(['ADMIN']);
  const p = channelSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const { id, name, platform, handle, active } = p.data;
  const payload = { name, platform, handle: handle || null, active: active ?? true };
  if (id) {
    await prisma.socialChannel.update({ where: { id }, data: payload });
  } else {
    const max = await prisma.socialChannel.aggregate({ _max: { sortOrder: true } });
    await prisma.socialChannel.create({ data: { ...payload, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  }
  await audit({ userId: user.id, action: id ? 'channel.update' : 'channel.create', entity: 'SocialChannel', entityId: id });
  revalidatePath('/admin/channels');
  revalidatePath('/workbook');
  return { ok: true };
}

// ─────────────── Toggle active + reorder (shared) ───────────────
type Entity = 'kpi' | 'task' | 'channel';

function model(entity: Entity) {
  if (entity === 'kpi') return prisma.kpiDefinition;
  if (entity === 'task') return prisma.taskDefinition;
  return prisma.socialChannel;
}
function pathFor(entity: Entity) {
  return entity === 'kpi' ? '/admin/kpis' : entity === 'task' ? '/admin/tasks' : '/admin/channels';
}

export async function toggleActive(entity: Entity, id: string, active: boolean): Promise<CfgResult> {
  const user = await requireRole(['ADMIN']);
  // @ts-expect-error - union of delegates share update signature
  await model(entity).update({ where: { id }, data: { active } });
  await audit({ userId: user.id, action: `${entity}.toggle`, entity, entityId: id, meta: { active } });
  revalidatePath(pathFor(entity));
  revalidatePath('/workbook');
  return { ok: true };
}

// Move an item up/down by swapping sortOrder with its neighbour.
export async function reorder(entity: Entity, id: string, direction: 'up' | 'down'): Promise<CfgResult> {
  const user = await requireRole(['ADMIN']);
  const m = model(entity);
  // @ts-expect-error - shared findUnique
  const current = await m.findUnique({ where: { id } });
  if (!current) return bad('Not found');
  // @ts-expect-error - shared findFirst
  const neighbour = await m.findFirst({
    where: direction === 'up' ? { sortOrder: { lt: current.sortOrder } } : { sortOrder: { gt: current.sortOrder } },
    orderBy: { sortOrder: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbour) return { ok: true }; // already at the edge
  await prisma.$transaction([
    // @ts-expect-error - shared update
    m.update({ where: { id: current.id }, data: { sortOrder: neighbour.sortOrder } }),
    // @ts-expect-error - shared update
    m.update({ where: { id: neighbour.id }, data: { sortOrder: current.sortOrder } }),
  ]);
  await audit({ userId: user.id, action: `${entity}.reorder`, entity, entityId: id, meta: { direction } });
  revalidatePath(pathFor(entity));
  revalidatePath('/workbook');
  return { ok: true };
}
