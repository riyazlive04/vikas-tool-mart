/* Manual check: logging + assigning a complaint feeds the complaint KPIs.
 *   npx tsx tests/_manual/complaints-integration.ts */
import { prisma } from '@/lib/db';
import { computeAutoValue } from '@/lib/kpi/auto';
import { getOrCreateDailyEntry } from '@/lib/workbook/entry';
import { toDateOnly } from '@/lib/dates';

async function run() {
  const today = toDateOnly(new Date());
  const cre = await prisma.user.findFirstOrThrow({ where: { role: 'CRE' } });
  const head = await prisma.user.findFirstOrThrow({ where: { role: 'HEAD' } });
  const entry = await getOrCreateDailyEntry(cre.id, today);

  const before = {
    logged: await computeAutoValue('DERIVED_COMPLAINTS_LOGGED', { dailyEntryId: entry.id, date: today }),
    assigned: await computeAutoValue('DERIVED_COMPLAINTS_ASSIGNED', { dailyEntryId: entry.id, date: today }),
  };

  const c = await prisma.complaint.create({
    data: { customerName: 'KPI Test', category: 'WARRANTY', description: 'test', loggedById: cre.id },
  });
  await prisma.complaint.update({ where: { id: c.id }, data: { assignedToId: head.id, assignedAt: new Date() } });

  const after = {
    logged: await computeAutoValue('DERIVED_COMPLAINTS_LOGGED', { dailyEntryId: entry.id, date: today }),
    assigned: await computeAutoValue('DERIVED_COMPLAINTS_ASSIGNED', { dailyEntryId: entry.id, date: today }),
  };

  console.log(`logged ${before.logged} -> ${after.logged} (expect +1)`);
  console.log(`assigned ${before.assigned} -> ${after.assigned} (expect +1)`);
  const pass = after.logged === (before.logged ?? 0) + 1 && after.assigned === (before.assigned ?? 0) + 1;
  console.log(pass ? 'PASS ✓' : 'FAIL ✗');

  await prisma.complaint.delete({ where: { id: c.id } });
  await prisma.$disconnect();
  if (!pass) process.exit(1);
}

run().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
