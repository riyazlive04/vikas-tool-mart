import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';
import { auth } from './index';

// Shape of the authenticated user including our additional fields.
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  locale: 'en' | 'ta';
  active: boolean;
};

export async function getSession() {
  return auth.api.getSession({ headers: headers() });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session?.user) return null;
  const u = session.user as unknown as SessionUser;
  return u;
}

// Redirects to /login when not authenticated or deactivated.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.active) redirect('/login?inactive=1');
  return user;
}

// Role gate. Falls back to the workbook (the lowest-privilege landing) when the
// user lacks the required role, so links are never dead-ends.
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/workbook');
  return user;
}

export function canManage(role: Role): boolean {
  return role === 'ADMIN' || role === 'HEAD';
}

export function isAdmin(role: Role): boolean {
  return role === 'ADMIN';
}
