import { useTranslations } from 'next-intl';

// Every dashboard metric is tagged Auto or Manual (PRD §10 — trustworthy
// visibility). Server-renderable (uses the next-intl message catalog).
export function SourceTag({ source }: { source: 'AUTO' | 'MANUAL' }) {
  const t = useTranslations('common');
  return (
    <span
      className={`badge ${source === 'AUTO' ? 'bg-success/20 text-success' : 'bg-gold/20 text-gold'}`}
    >
      {source === 'AUTO' ? t('auto') : t('manual')}
    </span>
  );
}
