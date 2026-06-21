import { prisma } from '@/lib/db';
import type { AutoSource, OrderActionType } from '@prisma/client';
import { dayRange } from '@/lib/dates';
import { avgRatingScaled, classifyCustomers, type CustomerLite, type OrderLite } from './compute';

const WORKLIST_ACTION: Partial<Record<AutoSource, OrderActionType>> = {
  WORKLIST_CONTACTED: 'CONTACTED',
  WORKLIST_REVIEW_REQ: 'REVIEW_REQ',
  WORKLIST_UNBOXING_REQ: 'UNBOXING_REQ',
  WORKLIST_TESTIMONIAL_REQ: 'TESTIMONIAL_REQ',
};

export type AutoContext = { dailyEntryId: string; date: Date };

/**
 * Compute a single auto KPI value from the DB for the given day/entry (PRD §7).
 * Returns null when no auto source applies. Caller decides override precedence.
 */
export async function computeAutoValue(
  source: AutoSource,
  ctx: AutoContext,
): Promise<number | null> {
  const { start, end } = dayRange(ctx.date);

  // Worklist tap-action counts (per-CRE, scoped to this DailyEntry).
  const action = WORKLIST_ACTION[source];
  if (action) {
    return prisma.orderAction.count({
      where: { dailyEntryId: ctx.dailyEntryId, action },
    });
  }

  switch (source) {
    case 'DERIVED_COMPLAINTS_LOGGED':
      return prisma.complaint.count({ where: { loggedAt: { gte: start, lt: end } } });

    case 'DERIVED_COMPLAINTS_ASSIGNED':
      return prisma.complaint.count({ where: { assignedAt: { gte: start, lt: end } } });

    case 'WOO_ONSITE_REVIEWS':
      return prisma.wooReview.count({
        where: { source: 'WOO_CUSREV', dateCreated: { gte: start, lt: end } },
      });

    case 'WOO_AVG_RATING': {
      // Rolling average across cached on-site reviews, scaled to /10.
      const reviews = await prisma.wooReview.findMany({
        where: { source: 'WOO_CUSREV' },
        select: { rating: true },
      });
      return avgRatingScaled(reviews.map((r) => r.rating));
    }

    case 'WOO_NEW_CUSTOMERS':
    case 'WOO_REPEAT_CUSTOMERS': {
      const orders = await prisma.wooOrder.findMany({
        where: { dateCreated: { gte: start, lt: end } },
        select: { customerWooId: true, dateCreated: true },
      });
      const ids = orders.map((o) => o.customerWooId).filter((v): v is number => v != null && v !== 0);
      const customers = ids.length
        ? await prisma.wooCustomer.findMany({
            where: { wooId: { in: ids } },
            select: { wooId: true, firstOrderDate: true, isRepeat: true },
          })
        : [];
      const map = new Map<number, CustomerLite>(customers.map((c) => [c.wooId, c]));
      const { newCount, repeatCount } = classifyCustomers(orders as OrderLite[], map, start);
      return source === 'WOO_NEW_CUSTOMERS' ? newCount : repeatCount;
    }

    default:
      return null;
  }
}
