'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  saveReflections,
  setKpiValue,
  toggleTask,
  setSocialSnapshot,
  submitEntry,
} from '@/app/actions/workbook';

type KpiType = 'NUMBER' | 'COUNT' | 'CHECK' | 'RATING';
export type WbKpi = {
  id: string;
  label: string;
  type: KpiType;
  target: number | null;
  unit: string | null;
  hasAuto: boolean;
  value: number | null;
  source: 'AUTO' | 'MANUAL';
  overridden: boolean;
  autoValue: number | null;
};
export type WbTask = { id: string; label: string; done: boolean };
export type WbSocial = { id: string; name: string; yesterdayCount: number | null; todayCount: number | null };

type Tab = 'kpis' | 'tasks' | 'social' | 'notes';

const textarea = 'field resize-none';

export function WorkbookClient({
  date,
  submitted,
  reflections,
  kpis,
  tasks,
  socials,
}: {
  date: string;
  submitted: boolean;
  reflections: { achievement: string; issues: string; commitment: string; notes: string };
  kpis: WbKpi[];
  tasks: WbTask[];
  socials: WbSocial[];
}) {
  const t = useTranslations('workbook');
  const [tab, setTab] = useState<Tab>('kpis');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const tabs: Tab[] = ['kpis', 'tasks', 'social', 'notes'];

  function onSubmit() {
    start(async () => {
      await submitEntry({ date });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
      {/* Achievement (above tabs, mirrors prototype) */}
      <Reflection
        title={t('achievement')}
        initial={reflections.achievement}
        onSave={(v) => saveReflections({ date, achievement: v })}
        rows={2}
      />

      {/* Tab nav */}
      <div className="flex gap-1.5">
        {tabs.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`tab flex-1 ${tab === tb ? 'tab-on' : 'tab-off'}`}>
            {t(`tabs.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'kpis' && (
        <div className="space-y-2">
          {kpis.map((k) => (
            <KpiRow key={k.id} kpi={k} date={date} />
          ))}
          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
            <Reflection title={t('issues')} initial={reflections.issues} rows={3}
              onSave={(v) => saveReflections({ date, issues: v })} />
            <Reflection title={t('commitment')} initial={reflections.commitment} rows={3}
              onSave={(v) => saveReflections({ date, commitment: v })} />
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted">{t('tapToComplete')}</p>
          {tasks.map((task, i) => (
            <TaskRow key={task.id} task={task} index={i} date={date} />
          ))}
        </div>
      )}

      {tab === 'social' && (
        <div className="space-y-2">
          {socials.map((s) => (
            <SocialRow key={s.id} social={s} date={date} />
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <Reflection title={t('notes')} initial={reflections.notes} rows={8}
          onSave={(v) => saveReflections({ date, notes: v })} />
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={pending}
        className={`btn w-full py-3.5 text-base uppercase tracking-wide text-ink ${
          saved || submitted ? 'bg-success hover:bg-success' : 'bg-gold hover:bg-gold-600'
        }`}
      >
        {saved ? '✓ ' + t('saveEntry') : submitted ? '✓ Submitted - update' : t('saveEntry')}
      </button>
    </div>
  );
}

// ── KPI row ──
function KpiRow({ kpi, date }: { kpi: WbKpi; date: string }) {
  const tc = useTranslations('common');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState(kpi.value != null ? String(kpi.value) : '');

  function save(value: number | null) {
    start(async () => {
      await setKpiValue({ date, kpiDefinitionId: kpi.id, value });
      router.refresh();
    });
  }

  if (kpi.type === 'CHECK') {
    const on = kpi.value === 1;
    return (
      <div className="flex items-center justify-between rounded-xl border border-line bg-card px-3.5 py-2.5">
        <span className="pr-2 text-sm text-neutral-200">{kpi.label}</span>
        <button
          onClick={() => save(on ? 0 : 1)}
          disabled={pending}
          aria-pressed={on}
          className={`h-9 w-9 rounded-md text-lg ${on ? 'bg-success text-white' : 'bg-neutral-700 text-neutral-400'}`}
        >
          {on ? '✓' : '○'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-card px-3.5 py-2.5">
      <div className="min-w-0 pr-2">
        <div className="text-sm text-neutral-200">
          {kpi.label}
          {kpi.target != null && <span className="ml-1.5 text-[10px] text-gold">{tc('target')}: {kpi.target}</span>}
        </div>
        {kpi.hasAuto && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
            <span className={kpi.overridden ? 'text-gold' : 'text-success'}>
              {kpi.overridden ? tc('edited') : tc('auto')}
            </span>
            {kpi.overridden && kpi.autoValue != null && (
              <button onClick={() => { setDraft(''); save(null); }} className="text-muted underline" disabled={pending}>
                revert → {kpi.autoValue}
              </button>
            )}
          </div>
        )}
      </div>
      <input
        type="number"
        min="0"
        step={kpi.type === 'RATING' ? '0.1' : '1'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const trimmed = draft.trim();
          const next = trimmed === '' ? null : Number(trimmed);
          const cur = kpi.value;
          if (next === cur) return;
          if (next != null && !Number.isFinite(next)) return;
          save(next);
        }}
        className={`w-16 rounded-lg border bg-elevated px-2 py-1.5 text-center text-sm font-bold text-neutral-100 outline-none transition focus:ring-2 focus:ring-gold/30 ${
          draft !== '' ? 'border-gold' : 'border-line'
        }`}
      />
    </div>
  );
}

// ── Task row ──
function TaskRow({ task, index, date }: { task: WbTask; index: number; date: string }) {
  const router = useRouter();
  const [done, setDone] = useState(task.done);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next); // optimistic
    start(async () => {
      const res = await toggleTask({ date, taskDefinitionId: task.id, done: next });
      if (!res.ok) setDone(!next);
      else router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex w-full items-center rounded-lg border px-3.5 py-2.5 text-left ${
        done ? 'border-success bg-success/10' : 'border-transparent bg-card'
      }`}
    >
      <span
        className={`mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-sm ${
          done ? 'bg-success text-white' : 'bg-neutral-700 text-neutral-500'
        }`}
      >
        {done ? '✓' : index + 1}
      </span>
      <span className={`text-sm ${done ? 'text-neutral-400 line-through' : 'text-neutral-200'}`}>
        {task.label}
      </span>
    </button>
  );
}

// ── Social row ──
function SocialRow({ social, date }: { social: WbSocial; date: string }) {
  const tc = useTranslations('common');
  const router = useRouter();
  const [y, setY] = useState(social.yesterdayCount != null ? String(social.yesterdayCount) : '');
  const [td, setTd] = useState(social.todayCount != null ? String(social.todayCount) : '');
  const [, start] = useTransition();

  const diff = (Number(td) || 0) - (Number(y) || 0);

  function save() {
    start(async () => {
      await setSocialSnapshot({
        date,
        channelId: social.id,
        yesterdayCount: y.trim() === '' ? null : Number(y),
        todayCount: td.trim() === '' ? null : Number(td),
      });
      router.refresh();
    });
  }

  const numCls = 'field p-2 text-center font-bold';

  return (
    <div className="rounded-xl border border-line bg-card p-3">
      <div className="mb-2 text-sm font-bold text-gold">{social.name}</div>
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <div className="mb-1 text-[10px] uppercase text-muted">{tc('yesterday')}</div>
          <input type="number" min="0" value={y} onChange={(e) => setY(e.target.value)} onBlur={save} className={numCls} />
        </label>
        <label className="flex-1">
          <div className="mb-1 text-[10px] uppercase text-muted">{tc('today')}</div>
          <input type="number" min="0" value={td} onChange={(e) => setTd(e.target.value)} onBlur={save} className={numCls} />
        </label>
        <div className="flex-1 text-center">
          <div className="mb-1 text-[10px] uppercase text-muted">{tc('change')}</div>
          <div className={`text-lg font-extrabold ${diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : 'text-muted'}`}>
            {diff > 0 ? `+${diff}` : diff === 0 ? '-' : diff}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reflection textarea with blur autosave ──
function Reflection({
  title,
  initial,
  rows,
  onSave,
}: {
  title: string;
  initial: string;
  rows: number;
  onSave: (value: string) => Promise<unknown>;
}) {
  const [value, setValue] = useState(initial);
  const [, start] = useTransition();

  return (
    <div>
      <div className="mb-1.5 vtm-label">{title}</div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value !== initial) start(() => void onSave(value));
        }}
        className={textarea}
      />
    </div>
  );
}
