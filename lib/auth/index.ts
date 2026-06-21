import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from './password';

// Better Auth server instance. Email+password only, session-based, no public
// sign-up (admins create users). Business fields live on the User row as
// additionalFields. Password hashing uses our shared scrypt helper so seeded
// credentials verify identically.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'CRE', input: false },
      department: { type: 'string', required: false, input: false },
      locale: { type: 'string', required: false, defaultValue: 'en', input: false },
      active: { type: 'boolean', required: false, defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
});

export type Auth = typeof auth;
