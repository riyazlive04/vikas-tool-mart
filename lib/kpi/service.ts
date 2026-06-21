import { prisma } from '@/lib/db';
import { computeAutoValue } from './auto';
import { resolveKpi, type ResolvedKpi } from './engine';
import type { KpiDefinition, KpiValue } from '@prisma/client';

export type ResolvedKpiRow = {
  def: KpiDefinition;
  stored: KpiValue | null;
  resolved: ResolvedKpi;
};

/**
 * Resolve every active KPI for a DailyEntry: compute auto values, apply manual
 * overrides, and return display-ready rows (PRD §7). Used by the Daily Workbook
 * and the dashboard.
 */
export async function resolveEntryKpis(dailyEntryId: string, date: Date): Promise<ResolvedKpiRow[]> {
  const [defs, stored] = await Promise.all([
    prisma.kpiDefinition.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.kpiValue.findMany({ where: { dailyEntryId } }),
  ]);
  const storedByDef = new Map(stored.map((s) => [s.kpiDefinitionId, s]));

  // Compute all auto values concurrently (was sequential — ~10 round-trips in a
  // row). Manual KPIs resolve to null without a query.
  const autoValues = await Promise.all(
    defs.map((def) =>
      def.autoSource ? computeAutoValue(def.autoSource, { dailyEntryId, date }) : Promise.resolve(null),
    ),
  );

  return defs.map((def, i) => {
    const s = storedByDef.get(def.id) ?? null;
    return { def, stored: s, resolved: resolveKpi({ def, stored: s, autoValue: autoValues[i] }) };
  });
}

// How many KPIs are "filled" (for the workbook progress bar): auto KPIs always
// count; manual KPIs count when a value is present.
export function countFilled(rows: ResolvedKpiRow[]): number {
  return rows.filter((r) => r.resolved.source === 'AUTO' || r.resolved.value != null).length;
}
