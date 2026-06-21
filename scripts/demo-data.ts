/* Demo data for screenshots / pilots. Idempotent. NOT for production.
 *   npx tsx scripts/demo-data.ts        # add demo data
 *   npx tsx scripts/demo-data.ts clear  # remove demo data (woo* + demo complaints)
 *
 * Demo Woo records use wooId >= 990000 so they're easy to identify/remove.
 */
import { prisma } from '@/lib/db';
import { getOrCreateDailyEntry } from '@/lib/workbook/entry';
import { toDateOnly } from '@/lib/dates';

const BASE = 990000;

const CUSTOMERS = [
  { wooId: BASE + 1, name: 'Arun Prakash', phone: '+91 90000 11111', orders: 3 },
  { wooId: BASE + 2, name: 'Meena Ravi', phone: '+91 90000 22222', orders: 1 },
  { wooId: BASE + 3, name: 'Senthil Kumar', phone: '+91 90000 33333', orders: 5 },
  { wooId: BASE + 4, name: 'Priya S', phone: '+91 90000 44444', orders: 1 },
];

const ORDERS = [
  { wooId: BASE + 101, number: '11023', cust: BASE + 1, total: 4250, status: 'completed' },
  { wooId: BASE + 102, number: '11024', cust: BASE + 2, total: 1899, status: 'processing' },
  { wooId: BASE + 103, number: '11025', cust: BASE + 3, total: 8750, status: 'completed' },
  { wooId: BASE + 104, number: '11026', cust: BASE + 4, total: 999, status: 'processing' },
  { wooId: BASE + 105, number: '11027', cust: BASE + 3, total: 3200, status: 'on-hold' },
  { wooId: BASE + 106, number: '11028', cust: 0, total: 1499, status: 'processing' },
];

const REVIEWS = [
  { wooId: BASE + 201, rating: 5, reviewer: 'Arun Prakash', product: 'INGCO Impact Drill', text: 'Excellent tool, fast delivery.' },
  { wooId: BASE + 202, rating: 4, reviewer: 'Meena Ravi', product: 'Wadfow Angle Grinder', text: 'Good value.' },
  { wooId: BASE + 203, rating: 5, reviewer: 'Senthil Kumar', product: 'INGCO Tool Set', text: 'Genuine product.' },
  { wooId: BASE + 204, rating: 5, reviewer: 'Priya S', product: 'Garden Sprayer', text: 'Works great.' },
  { wooId: BASE + 205, rating: 4, reviewer: 'Karthik', product: 'Cordless Screwdriver', text: 'Happy with it.' },
];

async function clear() {
  await prisma.orderAction.deleteMany({ where: { wooOrder: { wooId: { gte: BASE } } } });
  await prisma.wooOrder.deleteMany({ where: { wooId: { gte: BASE } } });
  await prisma.wooCustomer.deleteMany({ where: { wooId: { gte: BASE } } });
  await prisma.wooReview.deleteMany({ where: { wooId: { gte: BASE } } });
  await prisma.complaint.deleteMany({ where: { customerName: { in: ['Meena Ravi', 'Priya S'] }, description: { contains: '[demo]' } } });
  console.log('Demo data cleared.');
}

async function seed() {
  const today = toDateOnly(new Date());
  const dayMs = 86400000;

  for (const c of CUSTOMERS) {
    await prisma.wooCustomer.upsert({
      where: { wooId: c.wooId },
      update: { name: c.name, phone: c.phone, orderCount: c.orders, isRepeat: c.orders > 1, totalSpent: c.orders * 2500, firstOrderDate: new Date(today.getTime() - (c.orders > 1 ? 60 : 0) * dayMs) },
      create: { wooId: c.wooId, name: c.name, phone: c.phone, orderCount: c.orders, isRepeat: c.orders > 1, totalSpent: c.orders * 2500, firstOrderDate: new Date(today.getTime() - (c.orders > 1 ? 60 : 0) * dayMs) },
    });
  }

  for (const o of ORDERS) {
    const cust = CUSTOMERS.find((c) => c.wooId === o.cust);
    await prisma.wooOrder.upsert({
      where: { wooId: o.wooId },
      update: { number: o.number, customerWooId: o.cust || null, customerName: cust?.name ?? 'Guest', total: o.total, status: o.status, dateCreated: new Date(today.getTime() + 3600000) },
      create: { wooId: o.wooId, number: o.number, customerWooId: o.cust || null, customerName: cust?.name ?? 'Guest', total: o.total, status: o.status, dateCreated: new Date(today.getTime() + 3600000) },
    });
  }

  for (let i = 0; i < REVIEWS.length; i++) {
    const r = REVIEWS[i];
    await prisma.wooReview.upsert({
      where: { wooId: r.wooId },
      update: { source: 'WOO_CUSREV', rating: r.rating, reviewerName: r.reviewer, productName: r.product, text: r.text, dateCreated: new Date(today.getTime() - i * dayMs) },
      create: { wooId: r.wooId, source: 'WOO_CUSREV', rating: r.rating, reviewerName: r.reviewer, productName: r.product, text: r.text, dateCreated: new Date(today.getTime() - i * dayMs) },
    });
  }

  const cre = await prisma.user.findFirstOrThrow({ where: { role: 'CRE' } });
  const head = await prisma.user.findFirstOrThrow({ where: { role: 'HEAD' } });
  const entry = await getOrCreateDailyEntry(cre.id, today);

  // Worklist tap-actions (auto-feed KPIs).
  const orders = await prisma.wooOrder.findMany({ where: { wooId: { in: [BASE + 101, BASE + 102, BASE + 103, BASE + 104] } } });
  const acts: Array<[string, 'CONTACTED' | 'REVIEW_REQ' | 'UNBOXING_REQ' | 'TESTIMONIAL_REQ']> = [
    [orders[0].id, 'CONTACTED'], [orders[1].id, 'CONTACTED'], [orders[2].id, 'CONTACTED'],
    [orders[0].id, 'REVIEW_REQ'], [orders[2].id, 'REVIEW_REQ'], [orders[2].id, 'UNBOXING_REQ'],
  ];
  for (const [wooOrderId, action] of acts) {
    await prisma.orderAction.upsert({
      where: { wooOrderId_action_dailyEntryId: { wooOrderId, action, dailyEntryId: entry.id } },
      update: {}, create: { wooOrderId, action, dailyEntryId: entry.id, createdById: cre.id },
    });
  }

  // A few manual KPIs + tasks + social + reflections.
  const setKpi = async (key: string, val: number) => {
    const def = await prisma.kpiDefinition.findUnique({ where: { key } });
    if (!def) return;
    await prisma.kpiValue.upsert({
      where: { dailyEntryId_kpiDefinitionId: { dailyEntryId: entry.id, kpiDefinitionId: def.id } },
      update: { manualValue: val, source: 'MANUAL' },
      create: { dailyEntryId: entry.id, kpiDefinitionId: def.id, manualValue: val, source: 'MANUAL' },
    });
  };
  await setKpi('google_reviews_received', 3);
  await setKpi('feedback_forms_completed', 5);
  await setKpi('tip_of_the_day', 1);
  await setKpi('hand_tool_post', 1);

  const tasks = await prisma.taskDefinition.findMany({ take: 12, orderBy: { sortOrder: 'asc' } });
  for (let i = 0; i < tasks.length; i++) {
    await prisma.taskCompletion.upsert({
      where: { dailyEntryId_taskDefinitionId: { dailyEntryId: entry.id, taskDefinitionId: tasks[i].id } },
      update: { done: i % 3 !== 0 }, create: { dailyEntryId: entry.id, taskDefinitionId: tasks[i].id, done: i % 3 !== 0 },
    });
  }

  const channels = await prisma.socialChannel.findMany({ orderBy: { sortOrder: 'asc' } });
  const counts = [[1240, 1268], [880, 892], [2100, 2115], [430, 441], [150, 156]];
  for (let i = 0; i < channels.length; i++) {
    const [y, t] = counts[i] ?? [0, 0];
    await prisma.socialSnapshot.upsert({
      where: { dailyEntryId_channelId: { dailyEntryId: entry.id, channelId: channels[i].id } },
      update: { yesterdayCount: y, todayCount: t, source: 'MANUAL' },
      create: { dailyEntryId: entry.id, channelId: channels[i].id, yesterdayCount: y, todayCount: t, source: 'MANUAL' },
    });
  }

  await prisma.dailyEntry.update({
    where: { id: entry.id },
    data: {
      achievement: 'Closed 8 review requests and 2 testimonials yesterday.',
      issues: 'Two COD orders pending customer confirmation.',
      commitment: 'Follow up all on-hold orders and post the tip of the day.',
      notes: 'Festival promo driving repeat customers.',
      submittedAt: new Date(),
    },
  });

  // Complaints.
  const c1 = await prisma.complaint.create({
    data: { customerName: 'Meena Ravi', customerPhone: '+91 90000 22222', wooOrderRef: '11024', category: 'DELIVERY', description: '[demo] Order delivered late by 2 days.', loggedById: cre.id, status: 'IN_PROGRESS', assignedToId: head.id, assignedAt: new Date() },
  });
  await prisma.complaint.create({
    data: { customerName: 'Priya S', wooOrderRef: '11026', category: 'WARRANTY', description: '[demo] Drill battery not holding charge.', loggedById: cre.id, status: 'OPEN' },
  });
  void c1;

  console.log('Demo data seeded. Woo records use wooId >= ' + BASE + '.');
}

const cmd = process.argv[2];
(cmd === 'clear' ? clear() : seed())
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
