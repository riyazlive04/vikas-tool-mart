import 'server-only';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

// Append-only audit trail (PRD §5 AuditLog). Best-effort: never throw out of an
// audit write — a logging failure must not break the user action.
export async function audit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        meta: params.meta,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write log', err);
  }
}
