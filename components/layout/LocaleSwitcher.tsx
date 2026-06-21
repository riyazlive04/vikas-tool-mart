'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { setLocale } from '@/app/actions/locale';
import type { AppLocale } from '@/lib/i18n/config';

const LABELS: Record<AppLocale, string> = { en: 'EN', ta: 'த' };

export function LocaleSwitcher() {
  const current = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(locale: AppLocale) {
    if (locale === current) return;
    start(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1" aria-label="language">
      {(['en', 'ta'] as AppLocale[]).map((l) => (
        <button
          key={l}
          onClick={() => choose(l)}
          disabled={pending}
          aria-pressed={l === current}
          className={`min-h-tap rounded-md px-2 text-xs font-bold ${
            l === current ? 'bg-ink text-gold' : 'bg-black/10 text-ink/70'
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
