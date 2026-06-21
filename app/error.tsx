'use client';

// Global error boundary. Keeps the app from white-screening on an unexpected
// server/client error and offers a recovery path.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-phone flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl bg-danger/15 px-5 py-2 text-xs font-bold uppercase tracking-widest text-danger">
        Something went wrong
      </div>
      <p className="mt-4 text-sm text-muted">
        An unexpected error occurred. Your data is safe. Try again, or sign in afresh.
      </p>
      <button
        onClick={reset}
        className="mt-6 min-h-tap rounded-xl bg-gold px-6 py-3 text-sm font-extrabold text-ink"
      >
        Try again
      </button>
    </main>
  );
}
