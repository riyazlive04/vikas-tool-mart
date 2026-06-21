import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { getWooCredentials, type WooCredentials } from '@/lib/settings';

// Read-only WooCommerce REST client (PRD §6). We only ever GET.
export type WooClient = WooCommerceRestApi;

export function buildClient(creds: WooCredentials): WooClient {
  return new WooCommerceRestApi({
    url: creds.storeUrl,
    consumerKey: creds.consumerKey,
    consumerSecret: creds.consumerSecret,
    version: 'wc/v3',
    queryStringAuth: true, // safer for some hosts behind HTTPS proxies
    timeout: 20000,
  });
}

// Returns a client from stored settings, or null when not configured.
export async function getWooClient(): Promise<WooClient | null> {
  const creds = await getWooCredentials();
  if (!creds) return null;
  return buildClient(creds);
}

export type TestResult =
  | { ok: true; sample: { orders?: number } }
  | { ok: false; error: string };

// Lightweight connectivity probe against arbitrary (possibly unsaved) creds.
export async function testConnection(creds: WooCredentials): Promise<TestResult> {
  try {
    const client = buildClient(creds);
    const res = await client.get('orders', { per_page: 1 });
    const total = Number(res?.headers?.['x-wp-total']);
    return { ok: true, sample: { orders: Number.isFinite(total) ? total : undefined } };
  } catch (err) {
    return { ok: false, error: wooErrorMessage(err) };
  }
}

// Normalizes axios/Woo errors into a short, secret-free message.
export function wooErrorMessage(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { message?: string; code?: string } }; message?: string };
  if (e?.response?.status) {
    const code = e.response.data?.code ? ` (${e.response.data.code})` : '';
    const msg = e.response.data?.message || `HTTP ${e.response.status}`;
    return `${msg}${code}`;
  }
  return e?.message || 'Connection failed';
}
