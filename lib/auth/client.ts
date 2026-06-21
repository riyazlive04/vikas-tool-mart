'use client';

import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { Auth } from './index';

// Client-side auth (login form, useSession). inferAdditionalFields surfaces
// role/department/locale/active on the typed session user.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [inferAdditionalFields<Auth>()],
});

export const { signIn, signOut, useSession } = authClient;
