'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { assignComplaint, updateComplaint } from '@/app/actions/complaints';

type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type ComplaintDTO = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  wooOrderRef: string | null;
  category: string;
  description: string;
  status: Status;
  assignedToId: string | null;
  assignedToName: string | null;
  loggedByName: string;
  loggedAt: string;
  followUpAt: string | null;
  resolutionNotes: string | null;
};

const STATUS_STYLES: Record<Status, string> = {
  OPEN: 'bg-danger/20 text-danger',
  IN_PROGRESS: 'bg-gold/20 text-gold',
  RESOLVED: 'bg-success/20 text-success',
};

export function ComplaintCard({
  complaint,
  canManage,
  assignees,
}: {
  complaint: ComplaintDTO;
  canManage: boolean;
  assignees: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations('complaints');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(complaint.resolutionNotes ?? '');
  const [followUp, setFollowUp] = useState(complaint.followUpAt ?? '');

  function act(p: Promise<unknown>) {
    start(async () => {
      await p;
      router.refresh();
    });
  }

  const inputCls = 'field';

  return (
    <div className="vtm-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold">{complaint.customerName}</div>
          <div className="text-[11px] text-muted">
            {complaint.category}
            {complaint.wooOrderRef ? ` · #${complaint.wooOrderRef}` : ''}
            {complaint.customerPhone ? ` · ${complaint.customerPhone}` : ''}
          </div>
        </div>
        <span className={`rounded px-2 py-1 text-[10px] font-bold ${STATUS_STYLES[complaint.status]}`}>
          {t(`status.${complaint.status}`)}
        </span>
      </div>

      <p className="mt-2 text-sm text-neutral-300">{complaint.description}</p>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        <span>by {complaint.loggedByName}</span>
        <span>{complaint.loggedAt}</span>
        {complaint.assignedToName && <span>→ {complaint.assignedToName}</span>}
        {complaint.followUpAt && <span>follow-up {complaint.followUpAt}</span>}
      </div>

      <button onClick={() => setOpen((v) => !v)} className="mt-2 text-xs font-bold text-gold">
        {open ? 'Close' : 'Manage'}
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
          {/* Status */}
          <div className="flex gap-1.5">
            {(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as Status[]).map((s) => (
              <button
                key={s}
                disabled={pending}
                onClick={() => act(updateComplaint({ id: complaint.id, status: s }))}
                className={`min-h-tap flex-1 rounded-lg px-2 text-[11px] font-bold ${
                  complaint.status === s ? STATUS_STYLES[s] : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>

          {/* Assign (Head/Admin only) */}
          {canManage && (
            <select
              className={inputCls}
              value={complaint.assignedToId ?? ''}
              disabled={pending}
              onChange={(e) => e.target.value && act(assignComplaint({ id: complaint.id, assignedToId: e.target.value }))}
            >
              <option value="">{t('assignedTo')}…</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}

          {/* Follow-up + resolution notes */}
          <div>
            <label className="vtm-label">{t('followUp')}</label>
            <input type="date" className={`mt-1 ${inputCls}`} value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onBlur={() => act(updateComplaint({ id: complaint.id, followUpAt: followUp || null }))} />
          </div>
          <div>
            <label className="vtm-label">{t('resolutionNotes')}</label>
            <textarea rows={2} className={`mt-1 ${inputCls}`} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => act(updateComplaint({ id: complaint.id, resolutionNotes: notes || null }))} />
          </div>
        </div>
      )}
    </div>
  );
}
