'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Staff = { id: string; name: string };

export function ReportControls({
  canManage,
  today,
  staff,
  selfId,
}: {
  canManage: boolean;
  today: string;
  staff: Staff[];
  selfId: string;
}) {
  const t = useTranslations('reports');
  const [scope, setScope] = useState<'daily' | 'summary'>('daily');
  const [date, setDate] = useState(today);
  const [userId, setUserId] = useState(selfId);
  const [range, setRange] = useState<'today' | 'week' | 'month'>('week');

  function href(format: 'pdf' | 'excel') {
    const p = new URLSearchParams({ format, scope });
    if (scope === 'daily') {
      p.set('date', date);
      p.set('userId', userId);
    } else {
      p.set('range', range);
    }
    return `/api/export?${p.toString()}`;
  }

  const inputCls =
    'w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm outline-none focus:border-gold';

  return (
    <div className="vtm-card space-y-3">
      {/* Scope */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setScope('daily')}
          className={`min-h-tap flex-1 rounded-lg py-2 text-xs font-bold ${scope === 'daily' ? 'bg-gold text-ink' : 'bg-neutral-800 text-neutral-400'}`}
        >
          {t('daily')}
        </button>
        {canManage && (
          <button
            onClick={() => setScope('summary')}
            className={`min-h-tap flex-1 rounded-lg py-2 text-xs font-bold ${scope === 'summary' ? 'bg-gold text-ink' : 'bg-neutral-800 text-neutral-400'}`}
          >
            {t('summary')}
          </button>
        )}
      </div>

      {scope === 'daily' ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="vtm-label">Date</label>
            <input type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
          {canManage && (
            <div>
              <label className="vtm-label">{t('selectCre')}</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className={`mt-1 ${inputCls}`}>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="vtm-label">Range</label>
          <select value={range} onChange={(e) => setRange(e.target.value as 'today' | 'week' | 'month')} className={`mt-1 ${inputCls}`}>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <a href={href('pdf')} target="_blank" rel="noopener noreferrer"
          className="min-h-tap flex-1 rounded-lg bg-gold py-2.5 text-center text-sm font-bold text-ink">
          {t('download')} {t('pdf')}
        </a>
        <a href={href('excel')} target="_blank" rel="noopener noreferrer"
          className="min-h-tap flex-1 rounded-lg bg-neutral-700 py-2.5 text-center text-sm font-bold">
          {t('download')} {t('excel')}
        </a>
      </div>
    </div>
  );
}
