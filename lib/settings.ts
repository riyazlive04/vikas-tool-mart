import { prisma } from '@/lib/db';
import { encrypt, tryDecrypt } from '@/lib/crypto';
import type { Setting } from '@prisma/client';

const SINGLETON_ID = 'singleton';

// Returns the settings row, creating the singleton on first access.
export async function getSettings(): Promise<Setting> {
  const existing = await prisma.setting.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return prisma.setting.create({ data: { id: SINGLETON_ID } });
}

export type WooCredentials = {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

// Decrypts stored Woo credentials. Returns null when not fully configured.
export async function getWooCredentials(): Promise<WooCredentials | null> {
  const s = await getSettings();
  const key = tryDecrypt(s.wooKey);
  const secret = tryDecrypt(s.wooSecret);
  if (!s.wooStoreUrl || !key || !secret) return null;
  return { storeUrl: s.wooStoreUrl, consumerKey: key, consumerSecret: secret };
}

export type WooSettingsInput = {
  wooStoreUrl?: string | null;
  consumerKey?: string | null; // plaintext; encrypted here. Empty string = leave unchanged.
  consumerSecret?: string | null;
  syncCron?: string;
  reviewSource?: 'WOO' | 'CUSREV';
  googleReviewsAuto?: boolean;
};

// Persists Woo settings, encrypting any newly-supplied key/secret. Passing an
// empty/undefined key or secret leaves the stored (encrypted) value untouched
// so the UI never needs to re-enter secrets.
export async function updateWooSettings(input: WooSettingsInput): Promise<Setting> {
  const data: Record<string, unknown> = {};
  if (input.wooStoreUrl !== undefined) data.wooStoreUrl = input.wooStoreUrl?.trim() || null;
  if (input.consumerKey) data.wooKey = encrypt(input.consumerKey.trim());
  if (input.consumerSecret) data.wooSecret = encrypt(input.consumerSecret.trim());
  if (input.syncCron) data.syncCron = input.syncCron.trim();
  if (input.reviewSource) data.reviewSource = input.reviewSource;
  if (input.googleReviewsAuto !== undefined) data.googleReviewsAuto = input.googleReviewsAuto;

  return prisma.setting.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });
}

// Whether the store is wired up enough to attempt a sync.
export async function isWooConfigured(): Promise<boolean> {
  return (await getWooCredentials()) !== null;
}
