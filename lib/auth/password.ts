import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// Password hashing shared by Better Auth (lib/auth) and the Prisma seed so that
// seeded credentials verify correctly. scrypt via Node crypto - no native deps.
const scryptAsync = promisify(scrypt);
const KEYLEN = 64;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

// Better Auth calls verify with { hash, password }.
export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  const keyBuf = Buffer.from(key, 'hex');
  if (keyBuf.length !== derived.length) return false;
  return timingSafeEqual(keyBuf, derived);
}
