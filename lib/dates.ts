// Day-range helpers. DailyEntry.date is stored as a calendar date (midnight UTC).
// For "today's" Woo/complaint aggregates we use a [start, end) UTC window.
// NOTE: at SME scale and with manual override always available, a UTC calendar
// day is a fine approximation; revisit if precise IST boundaries are required.

export function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// Normalize any Date/string to a calendar date at midnight UTC.
export function toDateOnly(input: Date | string): Date {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function isWithin(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime();
  return t >= start.getTime() && t < end.getTime();
}

// YYYY-MM-DD in UTC (used for keys, inputs, display).
export function isoDate(date: Date): string {
  return toDateOnly(date).toISOString().slice(0, 10);
}
