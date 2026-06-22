'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { audit } from '@/lib/audit';

const roleEnum = z.enum(['ADMIN', 'HEAD', 'CRE']);
const localeEnum = z.enum(['en', 'ta']);

export type ActionResult = { ok: true } | { ok: false; error: string };

const createSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: roleEnum,
  department: z.string().trim().optional().nullable(),
  locale: localeEnum.default('en'),
});

export async function createUser(input: unknown): Promise<ActionResult> {
  const admin = await requireRole(['ADMIN']);
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { name, email, password, role, department, locale } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: 'A user with that email already exists' };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailVerified: true,
      role,
      department: department || null,
      locale,
      active: true,
      accounts: {
        create: {
          accountId: email,
          providerId: 'credential',
          password: passwordHash,
        },
      },
    },
  });
  // accountId should reference the user id; fix it up now that we have one.
  await prisma.account.updateMany({
    where: { userId: user.id, providerId: 'credential' },
    data: { accountId: user.id },
  });

  await audit({ userId: admin.id, action: 'user.create', entity: 'User', entityId: user.id, meta: { role } });
  revalidatePath('/admin/users');
  return { ok: true };
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  role: roleEnum,
  department: z.string().trim().optional().nullable(),
  locale: localeEnum,
});

export async function updateUser(input: unknown): Promise<ActionResult> {
  const admin = await requireRole(['ADMIN']);
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { id, name, role, department, locale } = parsed.data;
  await prisma.user.update({
    where: { id },
    data: { name, role, department: department || null, locale },
  });
  await audit({ userId: admin.id, action: 'user.update', entity: 'User', entityId: id, meta: { role } });
  revalidatePath('/admin/users');
  return { ok: true };
}

export async function setUserActive(id: string, active: boolean): Promise<ActionResult> {
  const admin = await requireRole(['ADMIN']);
  if (id === admin.id && !active) {
    return { ok: false, error: 'You cannot deactivate your own account' };
  }
  await prisma.user.update({ where: { id }, data: { active } });
  await audit({ userId: admin.id, action: active ? 'user.activate' : 'user.deactivate', entity: 'User', entityId: id });
  revalidatePath('/admin/users');
  return { ok: true };
}

export async function resetPassword(id: string, newPassword: string): Promise<ActionResult> {
  const admin = await requireRole(['ADMIN']);
  if (newPassword.length < 8) return { ok: false, error: 'Password must be at least 8 characters' };
  const passwordHash = await hashPassword(newPassword);
  const res = await prisma.account.updateMany({
    where: { userId: id, providerId: 'credential' },
    data: { password: passwordHash },
  });
  if (res.count === 0) {
    // No credential account yet (edge case) - create one.
    await prisma.account.create({
      data: { userId: id, accountId: id, providerId: 'credential', password: passwordHash },
    });
  }
  await audit({ userId: admin.id, action: 'user.resetPassword', entity: 'User', entityId: id });
  return { ok: true };
}
