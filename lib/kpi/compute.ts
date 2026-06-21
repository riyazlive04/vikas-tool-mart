// Pure KPI computation helpers — no DB, fully unit-testable (PRD §7).

export type CustomerLite = { wooId: number; firstOrderDate: Date | null; isRepeat: boolean };
export type OrderLite = { customerWooId: number | null; dateCreated: Date };

/**
 * Classify the day's orders into new vs repeat customers.
 * - A customer is NEW if their first order falls on this day (or they're unknown
 *   / guest with no history).
 * - REPEAT if they ordered today and their first order predates this day.
 * Counts distinct customers; guest/unknown orders each count as one new customer.
 */
export function classifyCustomers(
  orders: OrderLite[],
  customersByWooId: Map<number, CustomerLite>,
  dayStart: Date,
): { newCount: number; repeatCount: number } {
  let newCount = 0;
  let repeatCount = 0;
  const seen = new Set<number>();

  for (const o of orders) {
    // Guest / unknown customer → treat each order as a distinct new customer.
    if (o.customerWooId == null || o.customerWooId === 0) {
      newCount++;
      continue;
    }
    if (seen.has(o.customerWooId)) continue;
    seen.add(o.customerWooId);

    const cust = customersByWooId.get(o.customerWooId);
    // Repeat when their first order predates today (fall back to the isRepeat
    // flag when firstOrderDate is unknown but Woo marked them as returning).
    const firstBeforeToday =
      cust?.firstOrderDate != null && cust.firstOrderDate.getTime() < dayStart.getTime();
    const repeat = firstBeforeToday || (cust?.firstOrderDate == null && cust?.isRepeat === true);

    if (repeat) repeatCount++;
    else newCount++;
  }

  return { newCount, repeatCount };
}

// Average rating scaled to a /10 axis (Woo ratings are 1–5; KPI target is /10).
// Returns null when there are no ratings. Rounded to 1 decimal.
export function avgRatingScaled(ratings: number[]): number | null {
  const valid = ratings.filter((r) => Number.isFinite(r) && r > 0);
  if (valid.length === 0) return null;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round(mean * 2 * 10) / 10;
}

// Count how many actions in a list match a given action type.
export function countActions<T extends { action: string }>(actions: T[], action: string): number {
  return actions.reduce((n, a) => (a.action === action ? n + 1 : n), 0);
}
