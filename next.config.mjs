import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output for the Docker runner stage. On Vercel, let the platform
  // manage output (Vercel sets process.env.VERCEL at build time).
  output: process.env.VERCEL ? undefined : 'standalone',
  // Server actions are enabled by default in Next 14; raise body limit for exports.
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default withNextIntl(nextConfig);
