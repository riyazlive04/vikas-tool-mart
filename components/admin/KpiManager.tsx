'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveKpi, toggleActive, reorder, type CfgResult } from '@/app/actions/config';

type Kpi = {
  id: string;
  key: string;
  label: string;
  labelTa: string | null;
  type: 'NUMBER' | 'COUNT' | 'CHECK' | 'RATING';
  target: number | null;
  autoSource: string | null;
  unit: string | null;
  active: boolean;
};

const TYPES = ['NUMBER', 'COUNT', 'CHECK', 'RATING'] as const;
const SOURCES = [
  '', 'WOO_NEW_CUSTOMERS', 'WOO_REPEAT_CUSTOMERS', 'WOO_ONSITE_REVIEWS', 'WOO_AVG_RATING',
  'DERIVED_COMPLAINTS_LOGGED', 'DERIVED_COMPLAINTS_ASSIGNED',
  'WORKLIST_CONTACTED', 'WORKLIST_REVIEW_REQ', 'WORKLIST_UNBOXING_REQ', 'WORKLIST_TESTIMONIAL_REQ',
];
const inputCls = 'field';
const empty = { key: '', label: '', labelTa: '', type: 'COUNT' as Kpi['type'], target: '', autoSource: '', unit: '' };

export function KpiManager({ kpis }: { kpis: Kpi[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [form, setForm] = useState(empty);

  function run(p: Promise<CfgResult>, ok: string) {
    start(async () => {
      const r = await p;
      if (r.ok) { setMsg({ kind: 'ok', text: ok }); router.refresh(); }
      else setMsg({ kind: 'err', text: r.error });
    });
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    run(saveKpi({
      key: form.key, label: form.label, labelTa: form.labelTa || null, type: form.type,
      target: form.target === '' ? null : Number(form.target),
      autoSource: form.autoSource || null, unit: form.unit || null,
    }), 'KPI created');
    setForm(empty);
  }

  return (
    <div className="space-y-3">
      {msg && <div className={`rounded-lg px-3 py-2 text-sm font-semibold ${msg.kind === 'ok' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>{msg.text}</div>}

      <form onSubmit={create} className="vtm-card space-y-2">
        <h3 className="vtm-label">Add KPI</h3>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} placeholder="key (a_b_c)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required />
          <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Kpi['type'] })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className={inputCls} placeholder="Label (EN)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          <input className={inputCls} placeholder="Label (TA)" value={form.labelTa} onChange={(e) => setForm({ ...form, labelTa: e.target.value })} />
          <select className={inputCls} value={form.autoSource} onChange={(e) => setForm({ ...form, autoSource: e.target.value })}>
            {SOURCES.map((s) => <option key={s} value={s}>{s || 'manual'}</option>)}
          </select>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Target" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            <input className={inputCls} placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
        </div>
        <button disabled={pending} className="min-h-tap rounded-lg bg-gold px-4 text-sm font-bold text-ink disabled:opacity-60">Create KPI</button>
      </form>

      <div className="space-y-2">
        {kpis.map((k, i) => (
          <KpiRow key={k.id} kpi={k} first={i === 0} last={i === kpis.length - 1} pending={pending} run={run} />
        ))}
      </div>
    </div>
  );
}

function KpiRow({ kpi, first, last, pending, run }: { kpi: Kpi; first: boolean; last: boolean; pending: boolean; run: (p: Promise<CfgResult>, ok: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [d, setD] = useState({
    label: kpi.label, labelTa: kpi.labelTa ?? '', type: kpi.type,
    target: kpi.target?.toString() ?? '', autoSource: kpi.autoSource ?? '', unit: kpi.unit ?? '',
  });

  return (
    <div className={`vtm-card ${kpi.active ? '' : 'opacity-60'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{kpi.label}</div>
          <div className="text-[11px] text-muted">{kpi.type} · {kpi.autoSource || 'manual'}{kpi.target != null ? ` · target ${kpi.target}` : ''}</div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button aria-label="Move up" disabled={pending || first} onClick={() => run(reorder('kpi', kpi.id, 'up'), 'Moved')} className="h-8 w-8 rounded bg-neutral-700 disabled:opacity-30">↑</button>
          <button aria-label="Move down" disabled={pending || last} onClick={() => run(reorder('kpi', kpi.id, 'down'), 'Moved')} className="h-8 w-8 rounded bg-neutral-700 disabled:opacity-30">↓</button>
          <button onClick={() => setEdit((v) => !v)} className="min-h-tap rounded bg-neutral-700 px-2 text-xs font-bold">{edit ? 'Close' : 'Edit'}</button>
          <button disabled={pending} onClick={() => run(toggleActive('kpi', kpi.id, !kpi.active), 'Updated')}
            className={`min-h-tap rounded px-2 text-xs font-bold ${kpi.active ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
            {kpi.active ? 'Off' : 'On'}
          </button>
        </div>
      </div>
      {edit && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-neutral-800 pt-3">
          <input className={inputCls} value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} />
          <input className={inputCls} placeholder="TA" value={d.labelTa} onChange={(e) => setD({ ...d, labelTa: e.target.value })} />
          <select className={inputCls} value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as Kpi['type'] })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={inputCls} value={d.autoSource} onChange={(e) => setD({ ...d, autoSource: e.target.value })}>
            {SOURCES.map((s) => <option key={s} value={s}>{s || 'manual'}</option>)}
          </select>
          <input className={inputCls} placeholder="Target" value={d.target} onChange={(e) => setD({ ...d, target: e.target.value })} />
          <input className={inputCls} placeholder="Unit" value={d.unit} onChange={(e) => setD({ ...d, unit: e.target.value })} />
          <button disabled={pending}
            onClick={() => run(saveKpi({ id: kpi.id, key: kpi.key, label: d.label, labelTa: d.labelTa || null, type: d.type, target: d.target === '' ? null : Number(d.target), autoSource: d.autoSource || null, unit: d.unit || null, active: kpi.active }), 'Saved')}
            className="col-span-2 min-h-tap rounded-lg bg-gold text-sm font-bold text-ink disabled:opacity-60">Save</button>
        </div>
      )}
    </div>
  );
}
