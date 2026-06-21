import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a minimal standalone server bundle for the Docker runner stage.
  output: 'standalone',
  // Server actions are enabled by default in Next 14; raise body limit for exports.
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default withNextIntl(nextConfig);
