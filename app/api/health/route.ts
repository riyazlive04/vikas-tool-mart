import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Health probe for the VPS / docker healthcheck / uptime monitors.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'down' }, { status: 503 });
  }
}
