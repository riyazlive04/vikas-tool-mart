import type { AutoSource } from '@prisma/client';

// ── Pure resolver (PRD §7) - unit-tested, no DB. ──

export type ResolvedSource = 'AUTO' | 'MANUAL';

export type ResolvedKpi = {
  value: number | null;
  source: ResolvedSource;
  overridden: boolean;
  autoValue: number | null;
};

export type KpiDefLite = { autoSource: AutoSource | null };
export type StoredKpi = { manualValue: number | null; autoValue: number | null } | null | undefined;

/**
 * Resolve a single KPI's display value from its definition, any stored value,
 * and a freshly-computed auto value:
 *   1. Auto KPI with a manual override → manualValue, MANUAL, overridden=true
 *   2. Auto KPI without override        → autoValue,  AUTO,   overridden=false
 *   3. Pure manual KPI                  → manualValue (or empty), MANUAL
 */
export function resolveKpi(params: {
  def: KpiDefLite;
  stored: StoredKpi;
  autoValue: number | null;
}): ResolvedKpi {
  const { def, stored, autoValue } = params;
  const hasManual = stored != null && stored.manualValue != null;

  if (def.autoSource) {
    if (hasManual) {
      return { value: stored!.manualValue, source: 'MANUAL', overridden: true, autoValue };
    }
    return { value: autoValue, source: 'AUTO', overridden: false, autoValue };
  }

  // Pure manual KPI: value is whatever was entered (null = empty).
  return {
    value: stored?.manualValue ?? null,
    source: 'MANUAL',
    overridden: false,
    autoValue: null,
  };
}

// Which auto sources are computed per-CRE (tied to a DailyEntry's worklist
// actions) vs. global for the day (Woo/complaint aggregates).
export function isPerEntrySource(source: AutoSource): boolean {
  return (
    source === 'WORKLIST_CONTACTED' ||
    source === 'WORKLIST_REVIEW_REQ' ||
    source === 'WORKLIST_UNBOXING_REQ' ||
    source === 'WORKLIST_TESTIMONIAL_REQ'
  );
}
