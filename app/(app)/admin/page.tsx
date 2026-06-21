import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';

// Admin home. Phase 12 fills KPI/task/channel/Woo config; user management and
// WooCommerce settings link out from here.
const CARDS: Array<{ href: string; title: string; note: string; ready?: boolean }> = [
  { href: '/admin/users', title: 'Users', note: 'Add, edit roles, activate/deactivate', ready: true },
  { href: '/admin/woo', title: 'WooCommerce', note: 'Store URL, keys, sync schedule', ready: true },
  { href: '/admin/kpis', title: 'KPIs', note: 'Add/edit/reorder, set auto source', ready: true },
  { href: '/admin/tasks', title: 'Tasks', note: 'Daily checklist items', ready: true },
  { href: '/admin/channels', title: 'Social channels', note: 'Platforms & handles', ready: true },
];

export default async function AdminHome() {
  await requireRole(['ADMIN']);
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-extrabold text-gold">Admin</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href}
            className="vtm-card block transition hover:ring-1 hover:ring-gold">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{c.title}</span>
              {!c.ready && <span className="text-[10px] font-bold text-muted">SOON</span>}
            </div>
            <p className="mt-1 text-xs text-muted">{c.note}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
