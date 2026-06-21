'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveChannel, toggleActive, reorder, type CfgResult } from '@/app/actions/config';

type Channel = { id: string; name: string; platform: string; handle: string | null; active: boolean };
const inputCls = 'w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-2 text-sm outline-none focus:border-gold';

export function ChannelManager({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', platform: '', handle: '' });

  function run(p: Promise<CfgResult>, ok: string) {
    start(async () => { const r = await p; setMsg(r.ok ? ok : r.error); if (r.ok) router.refresh(); });
  }

  return (
    <div className="space-y-3">
      {msg && <div className="rounded-lg bg-card px-3 py-2 text-sm font-semibold text-gold">{msg}</div>}
      <form className="vtm-card grid grid-cols-1 gap-2 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run(saveChannel(form), 'Channel created'); setForm({ name: '', platform: '', handle: '' }); }}>
        <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={inputCls} placeholder="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} required />
        <input className={inputCls} placeholder="Handle" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} />
        <button disabled={pending} className="min-h-tap rounded-lg bg-gold px-4 text-sm font-bold text-ink disabled:opacity-60">Add</button>
      </form>
      <div className="space-y-1.5">
        {channels.map((c, i) => (
          <Row key={c.id} item={c} first={i === 0} last={i === channels.length - 1} pending={pending} run={run} />
        ))}
      </div>
    </div>
  );
}

function Row({ item, first, last, pending, run }: { item: Channel; first: boolean; last: boolean; pending: boolean; run: (p: Promise<CfgResult>, ok: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [d, setD] = useState({ name: item.name, platform: item.platform, handle: item.handle ?? '' });
  return (
    <div className={`vtm-card ${item.active ? '' : 'opacity-60'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm">{item.name} <span className="text-[11px] text-muted">{item.platform}{item.handle ? ` · ${item.handle}` : ''}</span></span>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button aria-label="Move up" disabled={pending || first} onClick={() => run(reorder('channel', item.id, 'up'), 'Moved')} className="h-8 w-8 rounded bg-neutral-700 disabled:opacity-30">↑</button>
          <button aria-label="Move down" disabled={pending || last} onClick={() => run(reorder('channel', item.id, 'down'), 'Moved')} className="h-8 w-8 rounded bg-neutral-700 disabled:opacity-30">↓</button>
          <button onClick={() => setEdit((v) => !v)} className="min-h-tap rounded bg-neutral-700 px-2 text-xs font-bold">{edit ? 'Close' : 'Edit'}</button>
          <button disabled={pending} onClick={() => run(toggleActive('channel', item.id, !item.active), 'Updated')}
            className={`min-h-tap rounded px-2 text-xs font-bold ${item.active ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>{item.active ? 'Off' : 'On'}</button>
        </div>
      </div>
      {edit && (
        <div className="mt-2 grid grid-cols-1 gap-2 border-t border-neutral-800 pt-2 sm:grid-cols-4">
          <input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
          <input className={inputCls} value={d.platform} onChange={(e) => setD({ ...d, platform: e.target.value })} />
          <input className={inputCls} placeholder="Handle" value={d.handle} onChange={(e) => setD({ ...d, handle: e.target.value })} />
          <button disabled={pending} onClick={() => run(saveChannel({ id: item.id, name: d.name, platform: d.platform, handle: d.handle || null, active: item.active }), 'Saved')}
            className="min-h-tap rounded-lg bg-gold px-4 text-sm font-bold text-ink">Save</button>
        </div>
      )}
    </div>
  );
}
