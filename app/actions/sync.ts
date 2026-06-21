'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/session';
import { audit } from '@/lib/audit';
import { runSync, type SyncResult } from '@/lib/sync';
import { updateWooSettings, getWooCredentials } from '@/lib/settings';
import { testConnection, type TestResult } from '@/lib/woo/client';

// Manual "Sync now" (PRD §6) — Admin/Head only.
export async function syncNow(): Promise<SyncResult> {
  const user = await requireRole(['ADMIN', 'HEAD']);
  const result = await runSync('MANUAL');
  await audit({
    userId: user.id,
    action: 'sync.manual',
    entity: 'SyncLog',
    meta: { status: result.status, ...result.recordsPulled },
  });
  revalidatePath('/admin/woo');
  revalidatePath('/dashboard');
  revalidatePath('/worklist');
  return result;
}

const cronRe = /^(\S+\s+){4}\S+$/; // 5-field cron
const wooSchema = z.object({
  wooStoreUrl: z.string().url('Enter a valid store URL').or(z.literal('')).optional(),
  consumerKey: z.string().optional(),
  consumerSecret: z.string().optional(),
  syncCron: z.string().regex(cronRe, 'Cron must have 5 fields').optional(),
  reviewSource: z.enum(['WOO', 'CUSREV']).optional(),
  googleReviewsAuto: z.boolean().optional(),
});

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveWooSettings(input: unknown): Promise<SaveResult> {
  const user = await requireRole(['ADMIN']);
  const parsed = wooSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  await updateWooSettings(parsed.data);
  await audit({ userId: user.id, action: 'settings.woo.update', entity: 'Setting', entityId: 'singleton' });
  revalidatePath('/admin/woo');
  return { ok: true };
}

// Test connection. Uses freshly-typed key/secret when provided, else the stored
// (decrypted) credentials — so an admin can re-test without re-entering secrets.
const testSchema = z.object({
  wooStoreUrl: z.string().url(),
  consumerKey: z.string().optional(),
  consumerSecret: z.string().optional(),
});

export async function testWooConnection(input: unknown): Promise<TestResult> {
  await requireRole(['ADMIN']);
  const parsed = testSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  let { consumerKey, consumerSecret } = parsed.data;
  if (!consumerKey || !consumerSecret) {
    const stored = await getWooCredentials();
    if (!stored) return { ok: false, error: 'Enter a consumer key and secret to test' };
    consumerKey = stored.consumerKey;
    consumerSecret = stored.consumerSecret;
  }
  return testConnection({ storeUrl: parsed.data.wooStoreUrl, consumerKey, consumerSecret });
}
