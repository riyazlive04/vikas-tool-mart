import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/lib/auth/session';
import { NavTabs } from '@/components/layout/NavTabs';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { LogoutButton } from '@/components/layout/LogoutButton';

// Protected shell for every signed-in route. requireUser() redirects to /login
// when there's no valid session (defence-in-depth alongside middleware).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const tb = await getTranslations('brand');

  return (
    <div className="mx-auto min-h-screen max-w-phone bg-ink lg:max-w-3xl">
      <header className="sticky top-0 z-20 bg-gold">
        <div className="flex items-center justify-between px-4 pt-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
              {tb('company')}
            </div>
            <div className="text-base font-extrabold leading-tight text-ink">{tb('app')}</div>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <LogoutButton />
          </div>
        </div>
        <div className="px-4 pb-1 pt-1 text-[11px] font-semibold text-ink/80">
          {user.name} · {user.role}
          {user.department ? ` · ${user.department}` : ''}
        </div>
        <NavTabs role={user.role} />
      </header>

      <main className="px-4 py-4">{children}</main>
    </div>
  );
}
