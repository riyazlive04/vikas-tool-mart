'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PRESETS: Array<{ key: string; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

export function RangeFilter({ current }: { current: string }) {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`/dashboard?range=${p.key}`}
            className={`min-h-tap flex-1 rounded-lg py-2 text-center text-xs font-bold ${
              current === p.key ? 'bg-gold text-ink' : 'bg-card text-neutral-400'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="min-h-tap flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 text-xs outline-none focus:border-gold" />
        <span className="text-xs text-muted">→</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="min-h-tap flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 text-xs outline-none focus:border-gold" />
        <button
          disabled={!from || !to}
          onClick={() => router.push(`/dashboard?range=custom&from=${from}&to=${to}`)}
          className="min-h-tap rounded-lg bg-neutral-700 px-3 text-xs font-bold disabled:opacity-50"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
