import { describe, it, expect } from 'vitest';
import { fullName, mapOrder, mapCustomer, mapReview } from '@/lib/woo/map';
import type { WooApiOrder, WooApiCustomer, WooApiReview } from '@/lib/woo/types';

describe('fullName', () => {
  it('joins first + last', () => {
    expect(fullName('Asha', 'Kumar')).toBe('Asha Kumar');
  });
  it('falls back when both empty', () => {
    expect(fullName(undefined, undefined)).toBe('Guest');
    expect(fullName('', '')).toBe('Guest');
  });
  it('handles a single name', () => {
    expect(fullName('Asha')).toBe('Asha');
  });
});

describe('mapOrder', () => {
  const order: WooApiOrder = {
    id: 101,
    number: 'VTM-101',
    status: 'processing',
    total: '1499.50',
    date_created: '2026-06-21T10:00:00',
    customer_id: 7,
    billing: { first_name: 'Asha', last_name: 'Kumar', phone: '999' },
    line_items: [{ id: 1, name: 'Drill', quantity: 1, total: '1499.50' }],
  };

  it('maps fields and parses numbers/dates', () => {
    const m = mapOrder(order);
    expect(m.wooId).toBe(101);
    expect(m.number).toBe('VTM-101');
    expect(m.customerWooId).toBe(7);
    expect(m.customerName).toBe('Asha Kumar');
    expect(m.total).toBe(1499.5);
    expect(m.status).toBe('processing');
    expect(m.dateCreated).toBeInstanceOf(Date);
    expect(Array.isArray(m.itemsJson)).toBe(true);
  });

  it('treats customer_id 0 as guest (null)', () => {
    expect(mapOrder({ ...order, customer_id: 0 }).customerWooId).toBeNull();
  });

  it('defaults a non-numeric total to 0', () => {
    expect(mapOrder({ ...order, total: '' }).total).toBe(0);
  });
});

describe('mapCustomer', () => {
  const base: WooApiCustomer = {
    id: 7,
    first_name: 'Asha',
    last_name: 'Kumar',
    email: 'asha@example.com',
    billing: { phone: '999' },
    date_created: '2026-01-01T00:00:00',
    orders_count: 3,
    total_spent: '5000',
  };

  it('marks >1 orders as repeat', () => {
    const m = mapCustomer(base);
    expect(m.isRepeat).toBe(true);
    expect(m.orderCount).toBe(3);
    expect(m.totalSpent).toBe(5000);
  });

  it('marks a single order as not repeat', () => {
    expect(mapCustomer({ ...base, orders_count: 1 }).isRepeat).toBe(false);
  });

  it('handles missing order count as not repeat', () => {
    expect(mapCustomer({ ...base, orders_count: undefined }).isRepeat).toBe(false);
  });
});

describe('mapReview', () => {
  it('maps a review and sets WOO_CUSREV source', () => {
    const r: WooApiReview = {
      id: 55,
      product_id: 9,
      product_name: 'Angle Grinder',
      reviewer: 'Ravi',
      review: 'Great',
      rating: 5,
      date_created: '2026-06-21T08:00:00',
    };
    const m = mapReview(r);
    expect(m.wooId).toBe(55);
    expect(m.source).toBe('WOO_CUSREV');
    expect(m.rating).toBe(5);
    expect(m.reviewerName).toBe('Ravi');
    expect(m.productName).toBe('Angle Grinder');
  });

  it('defaults missing reviewer to Anonymous', () => {
    const m = mapReview({ id: 1, product_id: 1, reviewer: '', review: '', rating: 4, date_created: '2026-06-21T00:00:00' });
    expect(m.reviewerName).toBe('Anonymous');
  });
});
