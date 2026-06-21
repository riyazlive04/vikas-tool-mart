'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveTask, toggleActive, reorder, type CfgResult } from '@/app/actions/config';

type Task = { id: string; label: string; labelTa: string | null; active: boolean };
const inputCls = 'w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-2 text-sm outline-none focus:border-gold';

export function TaskManager({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ label: '', labelTa: '' });

  function run(p: Promise<CfgResult>, ok: string) {
    start(async () => { const r = await p; setMsg(r.ok ? ok : r.error); if (r.ok) router.refresh(); });
  }

  return (
    <div className="space-y-3">
      {msg && <div className="rounded-lg bg-card px-3 py-2 text-sm font-semibold text-gold">{msg}</div>}
      <form className="vtm-card flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); run(saveTask(form), 'Task created'); setForm({ label: '', labelTa: '' }); }}>
        <input className={inputCls} placeholder="Label (EN)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
        <input className={inputCls} placeholder="Label (TA)" value={form.labelTa} onChange={(e) => setForm({ ...form, labelTa: e.target.value })} />
        <button disabled={pending} className="min-h-tap shrink-0 rounded-lg bg-gold px-4 text-sm font-bold text-ink disabled:opacity-60">Add</button>
      </form>
      <div className="space-y-1.5">
        {tasks.map((t, i) => (
          <Row key={t.id} item={t} first={i === 0} last={i === tasks.length - 1} pending={pending} run={run} />
        ))}
      </div>
    </div>
  );
}

function Row({ item, first, last, pending, run }: { item: Task; first: boolean; last: boolean; pending: boolean; run: (p: Promise<CfgResult>, ok: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [d, setD] = useState({ label: item.label, labelTa: item.labelTa ?? '' });
  return (
    <div className={`vtm-card ${item.active ? '' : 'opacity-60'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm">{item.label}{item.active ? '' : ' · off'}</span>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button disabled={pending || first} onClick={() => run(reorder('task', item.id, 'up'), 'Moved')} className="h-8 w-8 rounded bg-neutral-700 disabled:opacity-30">↑</button>
          <button disabled={pending || last} onClick={() => run(reorder('task', item.id, 'down'), 'Moved')} className="h-8 w-8 rounded bg-neutral-700 disabled:opacity-30">↓</button>
          <button onClick={() => setEdit((v) => !v)} className="min-h-tap rounded bg-neutral-700 px-2 text-xs font-bold">{edit ? 'Close' : 'Edit'}</button>
          <button disabled={pending} onClick={() => run(toggleActive('task', item.id, !item.active), 'Updated')}
            className={`min-h-tap rounded px-2 text-xs font-bold ${item.active ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>{item.active ? 'Off' : 'On'}</button>
        </div>
      </div>
      {edit && (
        <div className="mt-2 flex flex-col gap-2 border-t border-neutral-800 pt-2 sm:flex-row">
          <input className={inputCls} value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} />
          <input className={inputCls} placeholder="TA" value={d.labelTa} onChange={(e) => setD({ ...d, labelTa: e.target.value })} />
          <button disabled={pending} onClick={() => run(saveTask({ id: item.id, label: d.label, labelTa: d.labelTa || null, active: item.active }), 'Saved')}
            className="min-h-tap shrink-0 rounded-lg bg-gold px-4 text-sm font-bold text-ink">Save</button>
        </div>
      )}
    </div>
  );
}
