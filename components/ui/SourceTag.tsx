import { useTranslations } from 'next-intl';

// Every dashboard metric is tagged Auto or Manual (PRD §10 — trustworthy
// visibility). Server-renderable (uses the next-intl message catalog).
export function SourceTag({ source }: { source: 'AUTO' | 'MANUAL' }) {
  const t = useTranslations('common');
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
        source === 'AUTO' ? 'bg-success/20 text-success' : 'bg-gold/20 text-gold'
      }`}
    >
      {source === 'AUTO' ? t('auto') : t('manual')}
    </span>
  );
}
