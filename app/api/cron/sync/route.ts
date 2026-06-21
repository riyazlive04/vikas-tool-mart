import { NextResponse, type NextRequest } from 'next/server';
import { runSync } from '@/lib/sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Vercel Cron entry point — the serverless replacement for the node-cron worker
// (PRD §3/§4). Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically
// when the CRON_SECRET env var is set; we reject anything else so the endpoint
// can't be triggered by the public. Schedule is in vercel.json.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  const result = await runSync('SCHEDULED');
  return NextResponse.json(result);
}
