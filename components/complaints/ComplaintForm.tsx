'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createComplaint, searchWooOrders } from '@/app/actions/complaints';

const CATEGORIES = ['WARRANTY', 'DEFECT', 'DELIVERY', 'PRODUCT', 'OTHER'] as const;
const inputCls = 'field';

export function ComplaintForm({ prefill }: { prefill: { orderRef: string; customer: string } }) {
  const t = useTranslations('complaints');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [orderMatches, setOrderMatches] = useState<Array<{ number: string; customerName: string }>>([]);

  const [form, setForm] = useState({
    customerName: prefill.customer,
    customerPhone: '',
    wooOrderRef: prefill.orderRef,
    category: 'WARRANTY' as (typeof CATEGORIES)[number],
    description: '',
  });

  function onOrderSearch(value: string) {
    setForm({ ...form, wooOrderRef: value });
    if (value.trim().length >= 2) {
      start(async () => setOrderMatches(await searchWooOrders(value)));
    } else {
      setOrderMatches([]);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createComplaint(form);
      if (res.ok) {
        router.push('/complaints');
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="vtm-card space-y-3">
      {error && <div className="rounded-lg bg-danger/20 px-3 py-2 text-sm font-semibold text-danger">{error}</div>}

      <div>
        <label className="vtm-label">{t('customerName')}</label>
        <input className={`mt-1 ${inputCls}`} value={form.customerName} required
          onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="vtm-label">{t('phone')}</label>
          <input className={`mt-1 ${inputCls}`} value={form.customerPhone}
            onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
        </div>
        <div>
          <label className="vtm-label">{t('category')}</label>
          <select className={`mt-1 ${inputCls}`} value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as (typeof CATEGORIES)[number] })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="vtm-label">Order # (optional)</label>
        <input className={`mt-1 ${inputCls}`} list="woo-orders" value={form.wooOrderRef}
          placeholder="Search order # or customer"
          onChange={(e) => onOrderSearch(e.target.value)} />
        <datalist id="woo-orders">
          {orderMatches.map((o) => (
            <option key={o.number} value={o.number}>{o.number} - {o.customerName}</option>
          ))}
        </datalist>
      </div>

      <div>
        <label className="vtm-label">{t('description')}</label>
        <textarea rows={4} className={`mt-1 ${inputCls}`} value={form.description} required
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={pending}
          className="min-h-tap rounded-lg bg-gold px-4 text-sm font-bold text-ink disabled:opacity-60">
          {pending ? 'Saving…' : t('new')}
        </button>
        <button type="button" onClick={() => router.back()}
          className="min-h-tap rounded-lg bg-neutral-700 px-4 text-sm font-bold">
          Cancel
        </button>
      </div>
    </form>
  );
}
