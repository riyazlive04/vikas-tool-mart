'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { syncNow } from '@/app/actions/sync';
import type { SyncResult } from '@/lib/sync';

export function SyncNowButton({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('sync');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  function onClick() {
    start(async () => {
      const r = await syncNow();
      setResult(r);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        disabled={pending}
        className={`min-h-tap rounded-lg bg-gold font-bold text-ink disabled:opacity-60 ${
          compact ? 'px-3 text-xs' : 'px-4 text-sm'
        }`}
      >
        {pending ? t('running') : t('now')}
      </button>
      {result && !pending && (
        <span
          className={`text-xs font-semibold ${
            result.status === 'OK'
              ? 'text-success'
              : result.status === 'PARTIAL'
                ? 'text-gold'
                : 'text-danger'
          }`}
        >
          {result.status} · {result.recordsPulled.orders}o/{result.recordsPulled.customers}c/
          {result.recordsPulled.reviews}r
        </span>
      )}
    </div>
  );
}
