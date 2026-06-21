import { describe, it, expect } from 'vitest';
import { resolveKpi, isPerEntrySource } from '@/lib/kpi/engine';

describe('resolveKpi (PRD §7 precedence)', () => {
  it('auto KPI with no override returns the auto value, source AUTO', () => {
    const r = resolveKpi({ def: { autoSource: 'WORKLIST_CONTACTED' }, stored: null, autoValue: 7 });
    expect(r).toEqual({ value: 7, source: 'AUTO', overridden: false, autoValue: 7 });
  });

  it('auto KPI with a manual override returns the manual value, overridden=true', () => {
    const r = resolveKpi({
      def: { autoSource: 'WOO_NEW_CUSTOMERS' },
      stored: { manualValue: 12, autoValue: 9 },
      autoValue: 9,
    });
    expect(r.value).toBe(12);
    expect(r.source).toBe('MANUAL');
    expect(r.overridden).toBe(true);
    expect(r.autoValue).toBe(9); // auto still exposed for the "was 9" hint
  });

  it('auto KPI override of 0 is honored (0 is a real value, not empty)', () => {
    const r = resolveKpi({
      def: { autoSource: 'WOO_ONSITE_REVIEWS' },
      stored: { manualValue: 0, autoValue: 4 },
      autoValue: 4,
    });
    expect(r.value).toBe(0);
    expect(r.overridden).toBe(true);
  });

  it('pure manual KPI with a value returns it, source MANUAL, not overridden', () => {
    const r = resolveKpi({ def: { autoSource: null }, stored: { manualValue: 3, autoValue: null }, autoValue: null });
    expect(r).toEqual({ value: 3, source: 'MANUAL', overridden: false, autoValue: null });
  });

  it('pure manual KPI with no value is empty (null)', () => {
    const r = resolveKpi({ def: { autoSource: null }, stored: null, autoValue: null });
    expect(r.value).toBeNull();
    expect(r.source).toBe('MANUAL');
    expect(r.overridden).toBe(false);
  });

  it('auto KPI with no stored value and null autoValue stays AUTO/null', () => {
    const r = resolveKpi({ def: { autoSource: 'WOO_AVG_RATING' }, stored: null, autoValue: null });
    expect(r).toEqual({ value: null, source: 'AUTO', overridden: false, autoValue: null });
  });
});

describe('isPerEntrySource', () => {
  it('worklist sources are per-entry', () => {
    expect(isPerEntrySource('WORKLIST_CONTACTED')).toBe(true);
    expect(isPerEntrySource('WORKLIST_TESTIMONIAL_REQ')).toBe(true);
  });
  it('woo/derived sources are not per-entry', () => {
    expect(isPerEntrySource('WOO_NEW_CUSTOMERS')).toBe(false);
    expect(isPerEntrySource('DERIVED_COMPLAINTS_LOGGED')).toBe(false);
  });
});
