import type { AppLocale } from './config';

// Picks the locale-appropriate label for DB-stored definitions (KpiDefinition,
// TaskDefinition, …). These labels are admin-editable rows, not static message
// catalog entries, so they carry their own `label` (en) + `labelTa` (ta).
// Falls back to the English label when a Tamil one isn't set.
export function dbLabel(
  locale: AppLocale,
  label: string,
  labelTa?: string | null,
): string {
  if (locale === 'ta' && labelTa && labelTa.trim().length > 0) return labelTa;
  return label;
}
