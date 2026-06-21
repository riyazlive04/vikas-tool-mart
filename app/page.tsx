import { getTranslations } from 'next-intl/server';

// Phase 1 placeholder shell. Phases 3/8 replace this with auth-gated routing
// into /workbook, /worklist, /dashboard, etc.
export default async function Home() {
  const t = await getTranslations('brand');
  return (
    <main className="mx-auto flex min-h-screen max-w-phone flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl bg-gold px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-ink">
        {t('company')}
      </div>
      <h1 className="mt-6 text-2xl font-extrabold">{t('app')}</h1>
      <p className="mt-2 text-sm text-muted">{t('system')}</p>
      <p className="mt-10 text-xs text-muted">
        Scaffold ready. Build phases wire in auth, sync, worklist & dashboard.
      </p>
    </main>
  );
}
