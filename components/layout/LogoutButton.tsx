'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signOut } from '@/lib/auth/client';

export function LogoutButton() {
  const t = useTranslations('nav');
  const router = useRouter();

  async function onClick() {
    await signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      className="min-h-tap rounded-md bg-black/10 px-2.5 text-xs font-bold text-ink/80"
    >
      {t('logout')}
    </button>
  );
}
