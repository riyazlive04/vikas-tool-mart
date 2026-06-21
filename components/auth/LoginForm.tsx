'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from '@/lib/auth/client';
import { applyUserLocale } from '@/app/actions/locale';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/workbook';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn.email({ email, password });
    if (err) {
      setError(t('invalid'));
      setLoading(false);
      return;
    }
    // Sync the UI language to the signed-in user's saved preference.
    await applyUserLocale();
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <div>
        <label className="vtm-label" htmlFor="email">
          {t('email')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="vtm-label" htmlFor="password">
          {t('password')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </div>

      {error && <p className="text-sm font-semibold text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="min-h-tap w-full rounded-xl bg-gold py-3 text-base font-extrabold uppercase tracking-wide text-ink transition disabled:opacity-60"
      >
        {loading ? t('signIn') + '…' : t('signInCta')}
      </button>
    </form>
  );
}
