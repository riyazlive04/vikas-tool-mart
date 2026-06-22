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
        className="field w-auto font-semibold"
      />
      <span className="text-xs font-semibold text-muted">{dayName}</span>
      {date !== today && (
        <button onClick={() => go(today)} className="btn-secondary px-3 text-xs">
          Today
        </button>
      )}
    </div>
  );
}
