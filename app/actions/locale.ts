'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { LOCALE_COOKIE, isAppLocale, type AppLocale } from '@/lib/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

// Mirror the signed-in user's saved locale into the cookie next-intl reads.
export async function applyUserLocale() {
  const user = await getCurrentUser();
  const locale = isAppLocale(user?.locale) ? user!.locale : 'en';
  cookies().set(LOCALE_COOKIE, locale, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' });
}

// Runtime language switch: persist on the user row (if signed in) + set cookie.
export async function setLocale(locale: AppLocale) {
  if (!isAppLocale(locale)) return;
  const user = await getCurrentUser();
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { locale } });
  }
  cookies().set(LOCALE_COOKIE, locale, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' });
}
