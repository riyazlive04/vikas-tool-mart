import { describe, it, expect } from 'vitest';
import { classifyCustomers, avgRatingScaled, countActions, type CustomerLite, type OrderLite } from '@/lib/kpi/compute';

const day = new Date(Date.UTC(2026, 5, 21)); // 2026-06-21 00:00 UTC

describe('classifyCustomers', () => {
  it('counts a first-time buyer as new', () => {
    const orders: OrderLite[] = [{ customerWooId: 1, dateCreated: new Date(Date.UTC(2026, 5, 21, 10)) }];
    const map = new Map<number, CustomerLite>([
      [1, { wooId: 1, firstOrderDate: new Date(Date.UTC(2026, 5, 21)), isRepeat: false }],
    ]);
    expect(classifyCustomers(orders, map, day)).toEqual({ newCount: 1, repeatCount: 0 });
  });

  it('counts a returning buyer (first order earlier) as repeat', () => {
    const orders: OrderLite[] = [{ customerWooId: 2, dateCreated: new Date(Date.UTC(2026, 5, 21, 9)) }];
    const map = new Map<number, CustomerLite>([
      [2, { wooId: 2, firstOrderDate: new Date(Date.UTC(2026, 4, 1)), isRepeat: true }],
    ]);
    expect(classifyCustomers(orders, map, day)).toEqual({ newCount: 0, repeatCount: 1 });
  });

  it('dedupes multiple orders from the same customer', () => {
    const orders: OrderLite[] = [
      { customerWooId: 3, dateCreated: new Date(Date.UTC(2026, 5, 21, 8)) },
      { customerWooId: 3, dateCreated: new Date(Date.UTC(2026, 5, 21, 12)) },
    ];
    const map = new Map<number, CustomerLite>([
      [3, { wooId: 3, firstOrderDate: new Date(Date.UTC(2026, 1, 1)), isRepeat: true }],
    ]);
    expect(classifyCustomers(orders, map, day)).toEqual({ newCount: 0, repeatCount: 1 });
  });

  it('treats guest/unknown orders as distinct new customers', () => {
    const orders: OrderLite[] = [
      { customerWooId: 0, dateCreated: new Date(Date.UTC(2026, 5, 21, 8)) },
      { customerWooId: null, dateCreated: new Date(Date.UTC(2026, 5, 21, 9)) },
    ];
    expect(classifyCustomers(orders, new Map(), day)).toEqual({ newCount: 2, repeatCount: 0 });
  });

  it('uses isRepeat flag when firstOrderDate is unknown', () => {
    const orders: OrderLite[] = [{ customerWooId: 4, dateCreated: new Date(Date.UTC(2026, 5, 21)) }];
    const map = new Map<number, CustomerLite>([[4, { wooId: 4, firstOrderDate: null, isRepeat: true }]]);
    expect(classifyCustomers(orders, map, day)).toEqual({ newCount: 0, repeatCount: 1 });
  });
});

describe('avgRatingScaled', () => {
  it('returns null for no ratings', () => {
    expect(avgRatingScaled([])).toBeNull();
  });
  it('scales 1–5 ratings to /10', () => {
    expect(avgRatingScaled([5, 5, 5])).toBe(10);
    expect(avgRatingScaled([4, 5])).toBe(9); // mean 4.5 ×2 = 9
  });
  it('ignores zero/invalid ratings', () => {
    expect(avgRatingScaled([0, 4, 5])).toBe(9);
  });
  it('rounds to one decimal', () => {
    expect(avgRatingScaled([4, 4, 5])).toBe(8.7); // mean 4.333 ×2 = 8.666 → 8.7
  });
});

describe('countActions', () => {
  it('counts matching actions only', () => {
    const actions = [{ action: 'CONTACTED' }, { action: 'CONTACTED' }, { action: 'REVIEW_REQ' }];
    expect(countActions(actions, 'CONTACTED')).toBe(2);
    expect(countActions(actions, 'REVIEW_REQ')).toBe(1);
    expect(countActions(actions, 'UNBOXING_REQ')).toBe(0);
  });
});
