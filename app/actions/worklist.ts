'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { getOrCreateDailyEntry } from '@/lib/workbook/entry';
import { audit } from '@/lib/audit';

const schema = z.object({
  wooOrderId: z.string().min(1),
  action: z.enum(['CONTACTED', 'REVIEW_REQ', 'UNBOXING_REQ', 'TESTIMONIAL_REQ']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  on: z.boolean(),
});

export type ToggleResult = { ok: true; on: boolean } | { ok: false; error: string };

/**
 * Toggle a per-order CRE tap-action for the signed-in user's daily entry
 * (PRD §7). Creating/removing an OrderAction auto-feeds the matching worklist
 * KPI — no manual count entry. Idempotent: re-toggling on/off is safe.
 */
export async function toggleOrderAction(input: unknown): Promise<ToggleResult> {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  const { wooOrderId, action, date, on } = parsed.data;

  const entry = await getOrCreateDailyEntry(user.id, new Date(date));

  if (on) {
    await prisma.orderAction.upsert({
      where: {
        wooOrderId_action_dailyEntryId: { wooOrderId, action, dailyEntryId: entry.id },
      },
      update: {},
      create: { wooOrderId, action, dailyEntryId: entry.id, createdById: user.id },
    });
  } else {
    await prisma.orderAction.deleteMany({
      where: { wooOrderId, action, dailyEntryId: entry.id },
    });
  }

  await audit({
    userId: user.id,
    action: on ? 'worklist.action.add' : 'worklist.action.remove',
    entity: 'OrderAction',
    entityId: wooOrderId,
    meta: { action, date },
  });

  revalidatePath('/worklist');
  revalidatePath('/workbook');
  return { ok: true, on };
}
