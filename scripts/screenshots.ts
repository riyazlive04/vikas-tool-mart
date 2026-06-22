/* Capture UI screenshots for the user guide. Requires the app running locally.
 *   npx tsx scripts/screenshots.ts
 * Output: docs/screenshots/*.png  (consumed by scripts/user-guide.ts)
 */
import { chromium, type Page, type BrowserContext } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SHOT_URL || 'http://localhost:3000';
const OUT = 'docs/screenshots';

const CREDS = {
  admin: { email: process.env.SEED_ADMIN_EMAIL || 'md@vikastoolmart.test', password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!Admin1' },
  cre: { email: process.env.SEED_CRE_EMAIL || 'cre@vikastoolmart.test', password: process.env.SEED_CRE_PASSWORD || 'ChangeMe!Cre1' },
};

async function shot(page: Page, path: string, file: string) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true });
  console.log('  ✓', file);
}

async function login(page: Page, email: string, password: string) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await page.waitForURL('**/workbook', { timeout: 20000 });
}

async function run() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // CRE - mobile-first viewport.
  const creCtx: BrowserContext = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  const cre = await creCtx.newPage();
  console.log('CRE (mobile):');
  await shot(cre, '/login', '01-login.png');
  await login(cre, CREDS.cre.email, CREDS.cre.password);
  await shot(cre, '/workbook', '02-cre-workbook-kpis.png');
  // Tasks tab
  await cre.goto(BASE + '/workbook', { waitUntil: 'networkidle' });
  await cre.getByRole('button', { name: /tasks|பணிகள்/i }).first().click().catch(() => {});
  await cre.waitForTimeout(400);
  await cre.screenshot({ path: `${OUT}/03-cre-workbook-tasks.png`, fullPage: true });
  console.log('  ✓ 03-cre-workbook-tasks.png');
  await shot(cre, '/worklist', '04-cre-worklist.png');
  await shot(cre, '/complaints', '05-cre-complaints.png');
  await shot(cre, '/complaints/new', '06-cre-complaint-new.png');
  await shot(cre, '/reports', '07-cre-reports.png');
  await creCtx.close();

  // Admin / Head - tablet viewport for the dashboard table + admin config.
  const admCtx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 });
  const adm = await admCtx.newPage();
  console.log('Admin (tablet):');
  await login(adm, CREDS.admin.email, CREDS.admin.password);
  await shot(adm, '/dashboard', '10-dashboard.png');
  await shot(adm, '/admin', '11-admin-home.png');
  await shot(adm, '/admin/users', '12-admin-users.png');
  await shot(adm, '/admin/woo', '13-admin-woo.png');
  await shot(adm, '/admin/kpis', '14-admin-kpis.png');
  await admCtx.close();

  await browser.close();
  console.log('Screenshots written to', OUT);
}

run().catch((e) => { console.error(e); process.exit(1); });
