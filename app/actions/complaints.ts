'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { audit } from '@/lib/audit';

const category = z.enum(['WARRANTY', 'DEFECT', 'DELIVERY', 'PRODUCT', 'OTHER']);
const status = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']);

export type CResult = { ok: true; id?: string } | { ok: false; error: string };
const bad = (error = 'Invalid input'): CResult => ({ ok: false, error });

const createSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().trim().optional().nullable(),
  wooOrderRef: z.string().trim().optional().nullable(),
  category,
  description: z.string().min(3, 'Describe the complaint'),
});

// Logging a complaint feeds DERIVED_COMPLAINTS_LOGGED automatically (no double
// entry) — the KPI counts complaints by loggedAt.
export async function createComplaint(input: unknown): Promise<CResult> {
  const user = await requireUser();
  const p = createSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  const c = await prisma.complaint.create({
    data: {
      customerName: p.data.customerName,
      customerPhone: p.data.customerPhone || null,
      wooOrderRef: p.data.wooOrderRef || null,
      category: p.data.category,
      description: p.data.description,
      loggedById: user.id,
    },
  });
  await audit({ userId: user.id, action: 'complaint.create', entity: 'Complaint', entityId: c.id, meta: { category: p.data.category } });
  revalidatePath('/complaints');
  revalidatePath('/workbook');
  return { ok: true, id: c.id };
}

// Assigning sets assignedAt once → feeds DERIVED_COMPLAINTS_ASSIGNED. Head/Admin
// only (they triage). Also nudges status to IN_PROGRESS when still OPEN.
export async function assignComplaint(input: unknown): Promise<CResult> {
  const user = await requireUser();
  if (user.role === 'CRE') return bad('Only heads/admin can assign');
  const p = z.object({ id: z.string().min(1), assignedToId: z.string().min(1) }).safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);

  const existing = await prisma.complaint.findUnique({ where: { id: p.data.id } });
  if (!existing) return bad('Complaint not found');

  await prisma.complaint.update({
    where: { id: p.data.id },
    data: {
      assignedToId: p.data.assignedToId,
      assignedAt: existing.assignedAt ?? new Date(),
      status: existing.status === 'OPEN' ? 'IN_PROGRESS' : existing.status,
    },
  });
  await audit({ userId: user.id, action: 'complaint.assign', entity: 'Complaint', entityId: p.data.id, meta: { assignedToId: p.data.assignedToId } });
  revalidatePath('/complaints');
  revalidatePath('/workbook');
  return { ok: true };
}

const updateSchema = z.object({
  id: z.string().min(1),
  status: status.optional(),
  followUpAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  resolutionNotes: z.string().max(4000).nullable().optional(),
});

export async function updateComplaint(input: unknown): Promise<CResult> {
  const user = await requireUser();
  const p = updateSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);

  const existing = await prisma.complaint.findUnique({ where: { id: p.data.id } });
  if (!existing) return bad('Complaint not found');
  // CRE may only update complaints they logged.
  if (user.role === 'CRE' && existing.loggedById !== user.id) return bad('Not permitted');

  const data: Record<string, unknown> = {};
  if (p.data.status) {
    data.status = p.data.status;
    data.resolvedAt = p.data.status === 'RESOLVED' ? (existing.resolvedAt ?? new Date()) : null;
  }
  if (p.data.followUpAt !== undefined) data.followUpAt = p.data.followUpAt ? new Date(p.data.followUpAt) : null;
  if (p.data.resolutionNotes !== undefined) data.resolutionNotes = p.data.resolutionNotes || null;

  await prisma.complaint.update({ where: { id: p.data.id }, data });
  await audit({ userId: user.id, action: 'complaint.update', entity: 'Complaint', entityId: p.data.id, meta: data as object });
  revalidatePath('/complaints');
  return { ok: true };
}

// Lightweight order search for linking a complaint to a Woo order.
export async function searchWooOrders(query: string): Promise<Array<{ number: string; customerName: string }>> {
  await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];
  const orders = await prisma.wooOrder.findMany({
    where: {
      OR: [
        { number: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: { dateCreated: 'desc' },
    take: 8,
    select: { number: true, customerName: true },
  });
  return orders;
}
