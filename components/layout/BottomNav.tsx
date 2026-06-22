'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Role } from '@prisma/client';

type Key = 'workbook' | 'worklist' | 'complaints' | 'dashboard' | 'reports' | 'admin';
type Item = { href: string; key: Key; roles: Role[] };

const ITEMS: Item[] = [
  { href: '/workbook', key: 'workbook', roles: ['ADMIN', 'HEAD', 'CRE'] },
  { href: '/worklist', key: 'worklist', roles: ['ADMIN', 'HEAD', 'CRE'] },
  { href: '/complaints', key: 'complaints', roles: ['ADMIN', 'HEAD', 'CRE'] },
  { href: '/dashboard', key: 'dashboard', roles: ['ADMIN', 'HEAD'] },
  { href: '/reports', key: 'reports', roles: ['ADMIN', 'HEAD', 'CRE'] },
  { href: '/admin', key: 'admin', roles: ['ADMIN'] },
];

// Minimal inline icons (stroke = currentColor) so no icon dependency is needed.
function Icon({ name, className }: { name: Key; className?: string }) {
  const common = { className, width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'workbook':
      return (<svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>);
    case 'worklist':
      return (<svg {...common}><path d="M11 12h9" /><path d="M11 6h9" /><path d="M11 18h9" /><path d="m3 6 1 1 2-2" /><path d="m3 12 1 1 2-2" /><path d="m3 18 1 1 2-2" /></svg>);
    case 'complaints':
      return (<svg {...common}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>);
    case 'dashboard':
      return (<svg {...common}><path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="7" /><rect x="13" y="6" width="3" height="11" /></svg>);
    case 'reports':
      return (<svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>);
    case 'admin':
      return (<svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>);
  }
}

// Fixed bottom tab bar for one-thumb navigation on phones. Hidden on desktop
// (≥lg) where the header tab strip is shown instead.
export function BottomNav({ role }: { role: Role }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const items = ITEMS.filter((i) => i.roles.includes(role));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-phone items-stretch">
        {items.map((i) => {
          const active = pathname === i.href || pathname.startsWith(i.href + '/');
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-tap flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold transition ${
                active ? 'text-gold' : 'text-neutral-400'
              }`}
            >
              <Icon name={i.key} />
              <span className="truncate">{t(i.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
