/**
 * Scheduled WooCommerce sync worker (PRD §3, §4). A standalone process that
 * runs node-cron and calls the in-process sync service. Keep it dependency-light.
 *
 * Run: npm run worker   (or the `worker` docker-compose service)
 *
 * UPGRADE PATH: BullMQ — when sync volume or retry/backoff needs grow, replace
 * this in-process cron trigger with a Redis-backed BullMQ queue + workers. The
 * sync service (lib/sync) stays unchanged; only the trigger moves.
 */
import cron from 'node-cron';
import { runSync } from '@/lib/sync';
import { getSettings } from '@/lib/settings';

const DEFAULT_CRON = process.env.SYNC_CRON || '30 6 * * *';

async function resolveCron(): Promise<string> {
  try {
    const s = await getSettings();
    if (s.syncCron && cron.validate(s.syncCron)) return s.syncCron;
  } catch {
    // DB not reachable yet — fall back to env.
  }
  return cron.validate(DEFAULT_CRON) ? DEFAULT_CRON : '30 6 * * *';
}

async function runOnce(reason: string) {
  const startedAt = new Date().toISOString();
  console.log(`[worker] sync start (${reason}) @ ${startedAt}`);
  try {
    const result = await runSync('SCHEDULED');
    console.log(
      `[worker] sync ${result.status}`,
      `orders=${result.recordsPulled.orders}`,
      `customers=${result.recordsPulled.customers}`,
      `reviews=${result.recordsPulled.reviews}`,
      result.error ? `error="${result.error}"` : '',
    );
  } catch (err) {
    // runSync is designed not to throw, but guard the scheduler regardless.
    console.error('[worker] sync threw unexpectedly:', err);
  }
}

async function main() {
  const schedule = await resolveCron();
  console.log(`[worker] VTM CROS sync worker started. Schedule: "${schedule}"`);

  cron.schedule(schedule, () => {
    void runOnce('cron');
  });

  // Optional immediate run on boot for fresh deployments.
  if (process.env.SYNC_ON_BOOT === 'true') {
    void runOnce('boot');
  }

  // Keep the process alive.
  process.stdin.resume();
}

main().catch((err) => {
  console.error('[worker] fatal:', err);
  process.exit(1);
});
