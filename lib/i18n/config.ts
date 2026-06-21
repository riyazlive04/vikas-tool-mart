// Supported locales (PRD §3 / §10). Locale is a per-user preference stored on
// the User row and mirrored to a cookie so Server Components can read it.
export const locales = ['en', 'ta'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'en';
export const LOCALE_COOKIE = 'vtm_locale';

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === 'en' || value === 'ta';
}
