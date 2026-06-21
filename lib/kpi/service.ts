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

  const rows: ResolvedKpiRow[] = [];
  for (const def of defs) {
    const autoValue = def.autoSource
      ? await computeAutoValue(def.autoSource, { dailyEntryId, date })
      : null;
    const s = storedByDef.get(def.id) ?? null;
    rows.push({ def, stored: s, resolved: resolveKpi({ def, stored: s, autoValue }) });
  }
  return rows;
}

// How many KPIs are "filled" (for the workbook progress bar): auto KPIs always
// count; manual KPIs count when a value is present.
export function countFilled(rows: ResolvedKpiRow[]): number {
  return rows.filter((r) => r.resolved.source === 'AUTO' || r.resolved.value != null).length;
}
