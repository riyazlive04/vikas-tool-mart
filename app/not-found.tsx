import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-phone flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl font-extrabold text-gold">404</div>
      <p className="mt-3 text-sm text-muted">That page doesn’t exist.</p>
      <Link href="/workbook" className="mt-6 min-h-tap rounded-xl bg-gold px-6 py-3 text-sm font-extrabold text-ink">
        Go to workbook
      </Link>
    </main>
  );
}
