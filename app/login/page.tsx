import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage() {
  const tb = await getTranslations('brand');

  return (
    <main className="mx-auto flex min-h-screen max-w-phone flex-col justify-center px-6">
      <div className="mb-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Vikas Tool Mart" className="mx-auto mb-3 h-14 w-14 rounded-xl" />
        <div className="inline-block rounded-xl bg-gold px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
          {tb('company')}
        </div>
        <h1 className="mt-4 text-xl font-extrabold">{tb('app')}</h1>
        <p className="mt-1 text-xs text-muted">{tb('system')}</p>
      </div>
      <div className="vtm-card">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-[11px] text-muted">
        © {new Date().getFullYear()} Vikas Tool Mart · Built by{' '}
        <a
          href="https://sirahdigital.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-gold hover:underline"
        >
          Sirah Digital
        </a>
      </p>
    </main>
  );
}
