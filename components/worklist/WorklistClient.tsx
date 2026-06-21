'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toggleOrderAction } from '@/app/actions/worklist';

type ActionType = 'CONTACTED' | 'REVIEW_REQ' | 'UNBOXING_REQ' | 'TESTIMONIAL_REQ';

export type WorklistOrder = {
  id: string;
  number: string;
  customerName: string;
  total: number;
  status: string;
  actions: ActionType[];
};

const CHIPS: Array<{ action: ActionType; key: 'contacted' | 'reviewReq' | 'unboxingReq' | 'testimonialReq' }> = [
  { action: 'CONTACTED', key: 'contacted' },
  { action: 'REVIEW_REQ', key: 'reviewReq' },
  { action: 'UNBOXING_REQ', key: 'unboxingReq' },
  { action: 'TESTIMONIAL_REQ', key: 'testimonialReq' },
];

export function WorklistClient({
  orders,
  date,
}: {
  orders: WorklistOrder[];
  date: string;
}) {
  const t = useTranslations('worklist');
  const tc = useTranslations('common');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');

  const statuses = useMemo(
    () => ['all', ...Array.from(new Set(orders.map((o) => o.status)))],
    [orders],
  );

  const filtered = orders.filter((o) => {
    const matchesStatus = status === 'all' || o.status === status;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || o.number.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${tc('search')} #/customer`}
          className="min-h-tap flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm outline-none focus:border-gold"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-tap rounded-lg border border-neutral-700 bg-neutral-800 px-2 text-sm outline-none focus:border-gold"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? tc('filter') : s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="vtm-card text-center text-sm text-muted">
          {orders.length === 0
            ? 'No orders for this date. Sync WooCommerce or pick another day.'
            : 'No orders match your search.'}
        </div>
      ) : (
        filtered.map((o) => (
          <OrderRow key={o.id} order={o} date={date} chipLabel={(k) => t(k)} logLabel={t('logComplaint')} />
        ))
      )}
    </div>
  );
}

function OrderRow({
  order,
  date,
  chipLabel,
  logLabel,
}: {
  order: WorklistOrder;
  date: string;
  chipLabel: (k: 'contacted' | 'reviewReq' | 'unboxingReq' | 'testimonialReq') => string;
  logLabel: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Set<ActionType>>(new Set(order.actions));
  const [pending, start] = useTransition();

  function toggle(action: ActionType) {
    const on = !active.has(action);
    // Optimistic update.
    setActive((prev) => {
      const next = new Set(prev);
      if (on) next.add(action);
      else next.delete(action);
      return next;
    });
    start(async () => {
      const res = await toggleOrderAction({ wooOrderId: order.id, action, date, on });
      if (!res.ok) {
        // Revert on failure.
        setActive((prev) => {
          const next = new Set(prev);
          if (on) next.delete(action);
          else next.add(action);
          return next;
        });
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="vtm-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold">#{order.number}</div>
          <div className="truncate text-xs text-neutral-300">{order.customerName}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gold">₹{order.total.toLocaleString('en-IN')}</div>
          <div className="text-[10px] uppercase text-muted">{order.status}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {CHIPS.map((c) => {
          const on = active.has(c.action);
          return (
            <button
              key={c.action}
              onClick={() => toggle(c.action)}
              disabled={pending}
              aria-pressed={on}
              className={`vtm-chip border disabled:opacity-60 ${
                on
                  ? 'border-success bg-success/20 text-success'
                  : 'border-neutral-700 bg-neutral-800 text-neutral-300'
              }`}
            >
              {on ? '✓ ' : ''}
              {chipLabel(c.key)}
            </button>
          );
        })}
        <Link
          href={`/complaints/new?orderRef=${encodeURIComponent(order.number)}&customer=${encodeURIComponent(order.customerName)}`}
          className="vtm-chip border border-danger/60 bg-danger/10 text-danger"
        >
          ⚑ {logLabel}
        </Link>
      </div>
    </div>
  );
}
