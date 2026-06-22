import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM encryption for secrets at rest (WooCommerce key/secret - PRD §5,
// §10). Key is APP_ENCRYPTION_KEY (32 bytes, base64). Format: iv:tag:ciphertext
// (all base64). Never log plaintext or the key.
const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY || '';
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('APP_ENCRYPTION_KEY must be a 32-byte base64 string');
  }
  return key;
}

export function encrypt(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed ciphertext');
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return dec.toString('utf8');
}

// Safe decrypt - returns null instead of throwing (e.g. unset / rotated key).
export function tryDecrypt(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    return decrypt(payload);
  } catch {
    return null;
  }
}
