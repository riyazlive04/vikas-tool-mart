import { getTranslations } from 'next-intl/server';
import { getLastSync } from '@/lib/sync';

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Non-blocking sync status line/banner shown wherever Woo data appears (PRD §6).
export async function SyncStatus({ showBanner = true }: { showBanner?: boolean }) {
  const t = await getTranslations('sync');
  const last = await getLastSync();

  if (!last) {
    return <p className="text-[11px] text-muted">{t('never')}</p>;
  }

  const when = last.finishedAt ?? last.startedAt;
  const failed = last.status === 'FAILED';
  const partial = last.status === 'PARTIAL';

  return (
    <div>
      <p className="text-[11px] text-muted">
        {t('last')}: <span className="font-semibold text-neutral-300">{timeAgo(when)}</span>{' '}
        <span
          className={
            failed ? 'text-danger' : partial ? 'text-gold' : 'text-success'
          }
        >
          ({last.status})
        </span>
      </p>
      {showBanner && failed && (
        <div className="mt-2 rounded-lg bg-danger/15 px-3 py-2 text-xs font-semibold text-danger">
          {t('failed')}
        </div>
      )}
    </div>
  );
}
