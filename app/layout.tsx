import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

// Self-hosted Inter (no external Google Fonts request, no layout shift).
const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700', '800'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Vikas Tool Mart — CROS',
  description: 'Customer & Reputation Operations System',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/logo.png', apple: '/logo.png', shortcut: '/logo.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow pinch-zoom (accessibility); don't lock the scale.
  maximumScale: 5,
  themeColor: '#1A1A1A',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.className}>
      <body className="bg-ink antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
