/* Manual integration check (not part of `vitest run`). Run with:
 *   npx tsx tests/_manual/worklist-integration.ts
 * Seeds two Woo orders for today, records tap-actions, asserts the auto KPI
 * counts, then cleans up. */
import { prisma } from '@/lib/db';
import { getOrCreateDailyEntry } from '@/lib/workbook/entry';
import { computeAutoValue } from '@/lib/kpi/auto';
import { toDateOnly } from '@/lib/dates';

async function run() {
  const today = toDateOnly(new Date());
  await prisma.wooOrder.upsert({
    where: { wooId: 900001 },
    update: { dateCreated: today },
    create: { wooId: 900001, number: 'T-900001', customerName: 'Test Asha', total: 1000, status: 'processing', dateCreated: today },
  });
  await prisma.wooOrder.upsert({
    where: { wooId: 900002 },
    update: { dateCreated: today },
    create: { wooId: 900002, number: 'T-900002', customerName: 'Test Ravi', total: 1000, status: 'processing', dateCreated: today },
  });

  const orders = await prisma.wooOrder.findMany({ where: { wooId: { in: [900001, 900002] } } });
  const cre = await prisma.user.findFirstOrThrow({ where: { role: 'CRE' } });
  const entry = await getOrCreateDailyEntry(cre.id, today);

  const add = (wooOrderId: string, action: 'CONTACTED' | 'REVIEW_REQ') =>
    prisma.orderAction.upsert({
      where: { wooOrderId_action_dailyEntryId: { wooOrderId, action, dailyEntryId: entry.id } },
      update: {},
      create: { wooOrderId, action, dailyEntryId: entry.id, createdById: cre.id },
    });

  await add(orders[0].id, 'CONTACTED');
  await add(orders[1].id, 'CONTACTED');
  await add(orders[0].id, 'REVIEW_REQ');

  const contacted = await computeAutoValue('WORKLIST_CONTACTED', { dailyEntryId: entry.id, date: today });
  const reviewReq = await computeAutoValue('WORKLIST_REVIEW_REQ', { dailyEntryId: entry.id, date: today });
  const newCust = await computeAutoValue('WOO_NEW_CUSTOMERS', { dailyEntryId: entry.id, date: today });

  console.log(`RESULT CONTACTED=${contacted} (exp 2)  REVIEW_REQ=${reviewReq} (exp 1)  NEW_CUST=${newCust} (exp 2)`);
  const pass = contacted === 2 && reviewReq === 1 && newCust === 2;
  console.log(pass ? 'PASS ✓' : 'FAIL ✗');

  await prisma.orderAction.deleteMany({ where: { dailyEntryId: entry.id, wooOrderId: { in: orders.map((o) => o.id) } } });
  await prisma.wooOrder.deleteMany({ where: { wooId: { in: [900001, 900002] } } });
  await prisma.$disconnect();
  if (!pass) process.exit(1);
}

run().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
