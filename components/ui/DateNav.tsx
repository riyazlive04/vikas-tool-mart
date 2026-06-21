'use client';

import { useRouter, usePathname } from 'next/navigation';

// Date selector that drives the ?date= query param. Shared by worklist + workbook
// so they stay on the same day. Includes a quick "Today" jump.
export function DateNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(d: string) {
    router.push(`${pathname}?date=${d}`);
  }

  const dayName = new Date(date + 'T00:00:00Z').toLocaleDateString('en-IN', {
    weekday: 'long',
    timeZone: 'UTC',
  });

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => go(e.target.value)}
        className="min-h-tap rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm font-semibold outline-none focus:border-gold"
      />
      <span className="text-xs font-semibold text-muted">{dayName}</span>
      {date !== today && (
        <button
          onClick={() => go(today)}
          className="min-h-tap rounded-lg bg-neutral-700 px-3 text-xs font-bold"
        >
          Today
        </button>
      )}
    </div>
  );
}
