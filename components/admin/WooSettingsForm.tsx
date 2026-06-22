'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveWooSettings, testWooConnection } from '@/app/actions/sync';

type Props = {
  initial: {
    wooStoreUrl: string;
    hasKey: boolean;
    hasSecret: boolean;
    syncCron: string;
    reviewSource: 'WOO' | 'CUSREV';
    googleReviewsAuto: boolean;
  };
};

const inputCls = 'field';

export function WooSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [testing, startTest] = useTransition();
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [form, setForm] = useState({
    wooStoreUrl: initial.wooStoreUrl,
    consumerKey: '',
    consumerSecret: '',
    syncCron: initial.syncCron,
    reviewSource: initial.reviewSource,
    googleReviewsAuto: initial.googleReviewsAuto,
  });

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const res = await saveWooSettings(form);
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Settings saved' });
        setForm((f) => ({ ...f, consumerKey: '', consumerSecret: '' }));
        router.refresh();
      } else {
        setMsg({ kind: 'err', text: res.error });
      }
    });
  }

  function onTest() {
    setMsg(null);
    startTest(async () => {
      const res = await testWooConnection({
        wooStoreUrl: form.wooStoreUrl,
        consumerKey: form.consumerKey,
        consumerSecret: form.consumerSecret,
      });
      if (res.ok) {
        const orders = res.sample.orders;
        setMsg({ kind: 'ok', text: `Connected ✓${orders != null ? ` · ${orders} orders found` : ''}` });
      } else {
        setMsg({ kind: 'err', text: `Connection failed: ${res.error}` });
      }
    });
  }

  return (
    <form onSubmit={onSave} className="vtm-card space-y-4">
      {msg && (
        <div
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            msg.kind === 'ok' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div>
        <label className="vtm-label">Store URL</label>
        <input
          className={`mt-1 ${inputCls}`}
          placeholder="https://vikastoolmart.com"
          value={form.wooStoreUrl}
          onChange={(e) => setForm({ ...form, wooStoreUrl: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="vtm-label">Consumer key</label>
          <input
            className={`mt-1 ${inputCls}`}
            placeholder={initial.hasKey ? '•••••• (stored — leave blank to keep)' : 'ck_…'}
            value={form.consumerKey}
            onChange={(e) => setForm({ ...form, consumerKey: e.target.value })}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="vtm-label">Consumer secret</label>
          <input
            className={`mt-1 ${inputCls}`}
            type="password"
            placeholder={initial.hasSecret ? '•••••• (stored — leave blank to keep)' : 'cs_…'}
            value={form.consumerSecret}
            onChange={(e) => setForm({ ...form, consumerSecret: e.target.value })}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="vtm-label">Sync schedule (cron)</label>
          <input
            className={`mt-1 ${inputCls}`}
            placeholder="30 6 * * *"
            value={form.syncCron}
            onChange={(e) => setForm({ ...form, syncCron: e.target.value })}
          />
          <p className="mt-1 text-[11px] text-muted">Default 06:30 daily. Worker reads this value.</p>
        </div>
        <div>
          <label className="vtm-label">Review source</label>
          <select
            className={`mt-1 ${inputCls}`}
            value={form.reviewSource}
            onChange={(e) => setForm({ ...form, reviewSource: e.target.value as 'WOO' | 'CUSREV' })}
          >
            <option value="WOO">WooCommerce</option>
            <option value="CUSREV">CusRev</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-neutral-800 px-3 py-2">
        <div>
          <div className="text-sm font-semibold">Google reviews auto-pull</div>
          <div className="text-[11px] text-muted">Future (Google Business Profile OAuth). Manual in P1.</div>
        </div>
        <span className="rounded bg-neutral-700 px-2 py-1 text-[10px] font-bold text-muted">DISABLED</span>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-tap rounded-lg bg-gold px-4 text-sm font-bold text-ink disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save settings'}
        </button>
        <button
          type="button"
          onClick={onTest}
          disabled={testing || !form.wooStoreUrl}
          className="min-h-tap rounded-lg bg-neutral-700 px-4 text-sm font-bold disabled:opacity-50"
        >
          {testing ? 'Testing…' : 'Test connection'}
        </button>
      </div>
    </form>
  );
}
