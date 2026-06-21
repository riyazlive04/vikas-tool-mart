import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isAppLocale, LOCALE_COOKIE } from './config';

// Cookie-based locale (no URL prefix). The locale is set from the signed-in
// user's preference at login and is runtime-switchable via a Server Action that
// rewrites this cookie.
export default getRequestConfig(async () => {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
