/* Mobile audit: load each page at iPhone-12 width and flag horizontal overflow.
 *   npx tsx scripts/mobile-audit.ts   (app must be running on SHOT_URL)
 */
import { chromium, type Page } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SHOT_URL || 'http://localhost:3100';
const OUT = 'docs/screenshots/mobile';
const VP = { width: 390, height: 844 }; // iPhone 12/13/14

async function login(page: Page, email: string, password: string) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await page.waitForURL('**/workbook', { timeout: 20000 });
}

async function check(page: Page, path: string, file: string) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return { scrollW: el.scrollWidth, clientW: el.clientWidth };
  });
  const over = overflow.scrollW - overflow.clientW;
  const flag = over > 2 ? `⚠ OVERFLOW +${over}px` : 'ok';
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true });
  console.log(`  ${path.padEnd(18)} ${flag}`);
  return over > 2;
}

async function run() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  let bad = 0;

  console.log('Mobile audit @ 390×844:');
  if (await check(page, '/login', 'm-login.png')) bad++;
  await login(page, process.env.SEED_ADMIN_EMAIL || 'md@vikastoolmart.test', process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!Admin1');
  for (const [p, f] of [
    ['/workbook', 'm-workbook.png'],
    ['/worklist', 'm-worklist.png'],
    ['/complaints', 'm-complaints.png'],
    ['/complaints/new', 'm-complaint-new.png'],
    ['/reports', 'm-reports.png'],
    ['/dashboard', 'm-dashboard.png'],
    ['/admin', 'm-admin.png'],
    ['/admin/users', 'm-admin-users.png'],
    ['/admin/kpis', 'm-admin-kpis.png'],
    ['/admin/woo', 'm-admin-woo.png'],
  ] as const) {
    if (await check(page, p, f)) bad++;
  }

  await browser.close();
  console.log(bad === 0 ? '\n✅ No horizontal overflow on any page.' : `\n⚠ ${bad} page(s) overflow - needs a fix.`);
  process.exit(bad === 0 ? 0 : 1);
}

run().catch((e) => { console.error(e); process.exit(1); });
