import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getWooClient, wooErrorMessage, type WooClient } from '@/lib/woo/client';
import type { WooApiOrder, WooApiCustomer, WooApiReview } from '@/lib/woo/types';
import type { SyncType } from '@prisma/client';

// ── Configuration ──
const PAGE_SIZE = 50;
const MAX_PAGES = 100; // safety cap (≈5k records/entity/run)

export type SyncResult = {
  status: 'OK' | 'PARTIAL' | 'FAILED';
  recordsPulled: { orders: number; customers: number; reviews: number };
  error?: string;
  skipped?: boolean; // not configured
};

// Generic paginated GET. Stops when a page returns fewer than PAGE_SIZE rows.
async function fetchAll<T>(
  client: WooClient,
  endpoint: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await client.get(endpoint, { ...params, per_page: PAGE_SIZE, page });
    const rows = (res?.data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

function fullName(first?: string, last?: string, fallback = 'Guest'): string {
  const name = `${first ?? ''} ${last ?? ''}`.trim();
  return name || fallback;
}

/**
 * Idempotent WooCommerce read-sync (PRD §6). Pulls orders → customers → reviews,
 * upserts by wooId, writes a SyncLog, and never throws: on failure it records a
 * FAILED/PARTIAL log and leaves the prior cache intact so the app keeps working
 * on existing/manual data.
 */
export async function runSync(type: SyncType): Promise<SyncResult> {
  const log = await prisma.syncLog.create({ data: { type, status: 'OK' } });
  const counts = { orders: 0, customers: 0, reviews: 0 };

  const client = await getWooClient();
  if (!client) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { finishedAt: new Date(), status: 'FAILED', error: 'WooCommerce not configured' },
    });
    return { status: 'FAILED', recordsPulled: counts, error: 'WooCommerce not configured', skipped: true };
  }

  const settings = await getSettings();
  // Incremental: orders/reviews created after the last successful sync, minus a
  // small overlap so nothing slips through clock skew. First run pulls recent.
  const since = settings.lastSyncedAt
    ? new Date(settings.lastSyncedAt.getTime() - 60 * 60 * 1000) // 1h overlap
    : undefined;
  const afterParam = since ? { after: since.toISOString() } : {};

  const errors: string[] = [];

  // 1) Orders
  try {
    const orders = await fetchAll<WooApiOrder>(client, 'orders', afterParam);
    for (const o of orders) {
      await prisma.wooOrder.upsert({
        where: { wooId: o.id },
        update: {
          number: o.number,
          customerWooId: o.customer_id || null,
          customerName: fullName(o.billing?.first_name, o.billing?.last_name),
          total: Number(o.total) || 0,
          status: o.status,
          dateCreated: new Date(o.date_created),
          itemsJson: (o.line_items ?? []) as object,
          lastSyncedAt: new Date(),
        },
        create: {
          wooId: o.id,
          number: o.number,
          customerWooId: o.customer_id || null,
          customerName: fullName(o.billing?.first_name, o.billing?.last_name),
          total: Number(o.total) || 0,
          status: o.status,
          dateCreated: new Date(o.date_created),
          itemsJson: (o.line_items ?? []) as object,
        },
      });
    }
    counts.orders = orders.length;
  } catch (err) {
    errors.push(`orders: ${wooErrorMessage(err)}`);
  }

  // 2) Customers (refresh all; compute isRepeat). Customers change slowly, so a
  //    full refresh is fine at SME volume.
  try {
    const customers = await fetchAll<WooApiCustomer>(client, 'customers', { role: 'all', orderby: 'registered_date' });
    for (const c of customers) {
      const orderCount = Number(c.orders_count) || 0;
      await prisma.wooCustomer.upsert({
        where: { wooId: c.id },
        update: {
          name: fullName(c.first_name, c.last_name),
          phone: c.billing?.phone || null,
          email: c.email || null,
          firstOrderDate: c.date_created ? new Date(c.date_created) : null,
          orderCount,
          isRepeat: orderCount > 1,
          totalSpent: Number(c.total_spent) || 0,
          lastSyncedAt: new Date(),
        },
        create: {
          wooId: c.id,
          name: fullName(c.first_name, c.last_name),
          phone: c.billing?.phone || null,
          email: c.email || null,
          firstOrderDate: c.date_created ? new Date(c.date_created) : null,
          orderCount,
          isRepeat: orderCount > 1,
          totalSpent: Number(c.total_spent) || 0,
        },
      });
    }
    counts.customers = customers.length;
  } catch (err) {
    errors.push(`customers: ${wooErrorMessage(err)}`);
  }

  // 3) On-site product reviews (CusRev / Woo). Source is always WOO_CUSREV here;
  //    Google reviews remain manual in P1 (PRD §6).
  try {
    const reviews = await fetchAll<WooApiReview>(client, 'products/reviews', afterParam);
    for (const r of reviews) {
      await prisma.wooReview.upsert({
        where: { wooId: r.id },
        update: {
          source: 'WOO_CUSREV',
          rating: Number(r.rating) || 0,
          reviewerName: r.reviewer || 'Anonymous',
          productName: r.product_name || null,
          dateCreated: new Date(r.date_created),
          text: r.review || null,
          lastSyncedAt: new Date(),
        },
        create: {
          wooId: r.id,
          source: 'WOO_CUSREV',
          rating: Number(r.rating) || 0,
          reviewerName: r.reviewer || 'Anonymous',
          productName: r.product_name || null,
          dateCreated: new Date(r.date_created),
          text: r.review || null,
        },
      });
    }
    counts.reviews = reviews.length;
  } catch (err) {
    errors.push(`reviews: ${wooErrorMessage(err)}`);
  }

  // Finalize. All three failed → FAILED; some failed → PARTIAL; none → OK.
  const allFailed = errors.length === 3;
  const status: SyncResult['status'] = allFailed ? 'FAILED' : errors.length ? 'PARTIAL' : 'OK';

  // Only advance the watermark when nothing failed, so a partial run re-pulls.
  if (status === 'OK') {
    await prisma.setting.update({ where: { id: settings.id }, data: { lastSyncedAt: new Date() } });
  }

  await prisma.syncLog.update({
    where: { id: log.id },
    data: {
      finishedAt: new Date(),
      status,
      recordsPulled: counts,
      error: errors.length ? errors.join(' | ') : null,
    },
  });

  return { status, recordsPulled: counts, error: errors.length ? errors.join(' | ') : undefined };
}

// Latest sync log for status banners.
export async function getLastSync() {
  return prisma.syncLog.findFirst({ orderBy: { startedAt: 'desc' } });
}
