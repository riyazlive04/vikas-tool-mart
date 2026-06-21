'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Role } from '@prisma/client';

type NavItem = { href: string; key: 'workbook' | 'worklist' | 'complaints' | 'dashboard' | 'admin'; roles: Role[] };

const ITEMS: NavItem[] = [
  { href: '/workbook', key: 'workbook', roles: ['ADMIN', 'HEAD', 'CRE'] },
  { href: '/worklist', key: 'worklist', roles: ['ADMIN', 'HEAD', 'CRE'] },
  { href: '/complaints', key: 'complaints', roles: ['ADMIN', 'HEAD', 'CRE'] },
  { href: '/dashboard', key: 'dashboard', roles: ['ADMIN', 'HEAD'] },
  { href: '/admin', key: 'admin', roles: ['ADMIN'] },
];

export function NavTabs({ role }: { role: Role }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const items = ITEMS.filter((i) => i.roles.includes(role));

  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2">
      {items.map((i) => {
        const active = pathname === i.href || pathname.startsWith(i.href + '/');
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`min-h-tap whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${
              active ? 'bg-gold text-ink' : 'bg-card text-neutral-300'
            }`}
          >
            {t(i.key)}
          </Link>
        );
      })}
    </nav>
  );
}
