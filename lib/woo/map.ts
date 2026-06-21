import type { WooApiOrder, WooApiCustomer, WooApiReview } from './types';

// Pure transforms from Woo API objects → Prisma upsert payloads (PRD §6).
// Extracted so the sync mapping is unit-testable without a live store.

export function fullName(first?: string, last?: string, fallback = 'Guest'): string {
  const name = `${first ?? ''} ${last ?? ''}`.trim();
  return name || fallback;
}

export function mapOrder(o: WooApiOrder) {
  return {
    wooId: o.id,
    number: o.number,
    customerWooId: o.customer_id || null,
    customerName: fullName(o.billing?.first_name, o.billing?.last_name),
    total: Number(o.total) || 0,
    status: o.status,
    dateCreated: new Date(o.date_created),
    itemsJson: (o.line_items ?? []) as object,
  };
}

export function mapCustomer(c: WooApiCustomer) {
  const orderCount = Number(c.orders_count) || 0;
  return {
    wooId: c.id,
    name: fullName(c.first_name, c.last_name),
    phone: c.billing?.phone || null,
    email: c.email || null,
    firstOrderDate: c.date_created ? new Date(c.date_created) : null,
    orderCount,
    isRepeat: orderCount > 1,
    totalSpent: Number(c.total_spent) || 0,
  };
}

export function mapReview(r: WooApiReview) {
  return {
    wooId: r.id,
    source: 'WOO_CUSREV' as const,
    rating: Number(r.rating) || 0,
    reviewerName: r.reviewer || 'Anonymous',
    productName: r.product_name || null,
    dateCreated: new Date(r.date_created),
    text: r.review || null,
  };
}
