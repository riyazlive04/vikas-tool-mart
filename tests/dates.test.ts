import { describe, it, expect } from 'vitest';
import { dayRange, toDateOnly, isWithin, isoDate } from '@/lib/dates';

describe('dayRange', () => {
  it('returns a [00:00, +24h) UTC window', () => {
    const { start, end } = dayRange(new Date('2026-06-21T15:30:00Z'));
    expect(start.toISOString()).toBe('2026-06-21T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-06-22T00:00:00.000Z');
  });
});

describe('isWithin', () => {
  const { start, end } = dayRange(new Date('2026-06-21T00:00:00Z'));
  it('includes the start, excludes the end', () => {
    expect(isWithin(new Date('2026-06-21T00:00:00Z'), start, end)).toBe(true);
    expect(isWithin(new Date('2026-06-21T23:59:59Z'), start, end)).toBe(true);
    expect(isWithin(new Date('2026-06-22T00:00:00Z'), start, end)).toBe(false);
    expect(isWithin(new Date('2026-06-20T23:59:59Z'), start, end)).toBe(false);
  });
});

describe('toDateOnly / isoDate', () => {
  it('strips time to midnight UTC', () => {
    expect(toDateOnly('2026-06-21T18:45:00Z').toISOString()).toBe('2026-06-21T00:00:00.000Z');
  });
  it('formats YYYY-MM-DD', () => {
    expect(isoDate(new Date('2026-06-21T18:45:00Z'))).toBe('2026-06-21');
  });
});
