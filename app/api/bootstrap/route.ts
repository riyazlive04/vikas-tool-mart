import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { seedDatabase } from '@/prisma/seed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// One-time setup + diagnostic for cloud deploys (e.g. Vercel) where the
// build-time seed may not have populated the runtime database.
//   GET /api/bootstrap?secret=<CRON_SECRET>          → seeds only if empty
//   GET /api/bootstrap?secret=<CRON_SECRET>&force=1  → re-runs the seed (idempotent)
// Guarded by CRON_SECRET so it can't be triggered publicly. Reports the DB host
// (no credentials) so build-vs-runtime DB mismatches are obvious.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.nextUrl.searchParams.get('secret');
  if (!secret || given !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let dbHost = 'unknown';
  try {
    dbHost = new URL(process.env.DATABASE_URL || '').host || 'unknown';
  } catch {
    /* ignore */
  }

  try {
    const usersBefore = await prisma.user.count();
    const force = req.nextUrl.searchParams.get('force') === '1';
    let seeded = false;
    let credentials: Array<{ role: string; email: string; password: string }> | undefined;

    if (usersBefore === 0 || force) {
      const result = await seedDatabase();
      seeded = true;
      credentials = result.credentials;
    }

    const usersAfter = await prisma.user.count();

    // Confirm the runtime can verify a seeded credential (hash compatibility).
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: { accounts: { where: { providerId: 'credential' }, take: 1 } },
    });
    const adminPw = admin?.accounts[0]?.password;
    const adminVerifies = adminPw
      ? await verifyPassword({ hash: adminPw, password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!Admin1' })
      : null;

    return NextResponse.json({
      ok: true,
      dbHost,
      usersBefore,
      usersAfter,
      seeded,
      adminEmail: admin?.email ?? null,
      adminVerifies,
      credentials,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, dbHost, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
