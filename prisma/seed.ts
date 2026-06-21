/**
 * Seed (PRD §11). Idempotent — safe to re-run. Uses stable ids / unique keys so
 * upserts don't duplicate. Prints seed credentials once at the end.
 */
import { PrismaClient, KpiType, AutoSource, Role, Locale } from '@prisma/client';
import { hashPassword } from '../lib/auth/password';

const prisma = new PrismaClient();

// ── KPIs (PRD §11.1) — key, EN/TA label, type, target, autoSource, unit ──
const KPIS: Array<{
  key: string;
  label: string;
  labelTa: string;
  type: KpiType;
  target?: number;
  autoSource?: AutoSource;
  unit?: string;
}> = [
  { key: 'avg_customer_rating', label: 'Average Customer Rating (1–10)', labelTa: 'சராசரி வாடிக்கையாளர் மதிப்பீடு (1–10)', type: KpiType.RATING, target: 9.0, autoSource: AutoSource.WOO_AVG_RATING, unit: '/10' },
  { key: 'google_review_requested', label: 'Google Review Requested', labelTa: 'Google மதிப்புரை கோரப்பட்டது', type: KpiType.COUNT, autoSource: AutoSource.WORKLIST_REVIEW_REQ },
  { key: 'unboxing_video_requested', label: 'Unboxing Video Requested', labelTa: 'அன்பாக்சிங் வீடியோ கோரப்பட்டது', type: KpiType.COUNT, autoSource: AutoSource.WORKLIST_UNBOXING_REQ },
  { key: 'testimonial_requested', label: 'Testimonial Requested', labelTa: 'சான்றுரை கோரப்பட்டது', type: KpiType.COUNT, autoSource: AutoSource.WORKLIST_TESTIMONIAL_REQ },
  { key: 'customers_contacted', label: 'Customers Contacted', labelTa: 'தொடர்பு கொள்ளப்பட்ட வாடிக்கையாளர்கள்', type: KpiType.COUNT, autoSource: AutoSource.WORKLIST_CONTACTED },
  { key: 'google_reviews_received', label: 'Google Reviews Received', labelTa: 'பெறப்பட்ட Google மதிப்புரைகள்', type: KpiType.COUNT },
  { key: 'onsite_reviews_received', label: 'On-site Reviews Received', labelTa: 'தளத்தில் பெறப்பட்ட மதிப்புரைகள்', type: KpiType.COUNT, autoSource: AutoSource.WOO_ONSITE_REVIEWS },
  { key: 'feedback_forms_completed', label: 'Feedback Forms Completed', labelTa: 'நிறைவு செய்யப்பட்ட கருத்துப் படிவங்கள்', type: KpiType.COUNT },
  { key: 'complaints_logged', label: 'Customer Complaints Logged', labelTa: 'பதிவு செய்யப்பட்ட வாடிக்கையாளர் புகார்கள்', type: KpiType.COUNT, autoSource: AutoSource.DERIVED_COMPLAINTS_LOGGED },
  { key: 'complaints_assigned', label: 'Customer Complaints Assigned', labelTa: 'ஒதுக்கப்பட்ட வாடிக்கையாளர் புகார்கள்', type: KpiType.COUNT, autoSource: AutoSource.DERIVED_COMPLAINTS_ASSIGNED },
  { key: 'repeat_customers', label: 'Repeat Customers', labelTa: 'மீண்டும் வரும் வாடிக்கையாளர்கள்', type: KpiType.COUNT, autoSource: AutoSource.WOO_REPEAT_CUSTOMERS },
  { key: 'new_customers', label: 'New Customers', labelTa: 'புதிய வாடிக்கையாளர்கள்', type: KpiType.COUNT, autoSource: AutoSource.WOO_NEW_CUSTOMERS },
  { key: 'packing_area_story', label: 'Packing Area Story Posted', labelTa: 'பேக்கிங் பகுதி ஸ்டோரி பதிவிடப்பட்டது', type: KpiType.CHECK },
  { key: 'crowd_visit_story', label: 'Crowd / Customer Visit Story Posted', labelTa: 'கூட்டம் / வாடிக்கையாளர் வருகை ஸ்டோரி பதிவிடப்பட்டது', type: KpiType.CHECK },
  { key: 'tip_of_the_day', label: 'Tip of the Day Posted', labelTa: 'இன்றைய குறிப்பு பதிவிடப்பட்டது', type: KpiType.CHECK },
  { key: 'hand_tool_post', label: 'Hand Tool Post Uploaded', labelTa: 'கைக் கருவி பதிவு பதிவேற்றப்பட்டது', type: KpiType.CHECK },
  { key: 'stock_clearance_post', label: 'Stock Clearance Post Uploaded', labelTa: 'ஸ்டாக் கிளியரன்ஸ் பதிவு பதிவேற்றப்பட்டது', type: KpiType.CHECK },
  { key: 'new_product_restock_post', label: 'New Product Restock Post Uploaded', labelTa: 'புதிய தயாரிப்பு மறுசரக்கு பதிவு பதிவேற்றப்பட்டது', type: KpiType.CHECK },
];

// ── Tasks (PRD §11.2) — "Invoice List Received" removed (now automatic) ──
const TASKS: Array<{ id: string; label: string; labelTa: string }> = [
  { id: 'task_whatsapp_review', label: 'WhatsApp Review Request Sent', labelTa: 'WhatsApp மதிப்புரை கோரிக்கை அனுப்பப்பட்டது' },
  { id: 'task_followup_calls', label: 'Customer Follow-up Calls Done', labelTa: 'வாடிக்கையாளர் பின்தொடர் அழைப்புகள் முடிந்தன' },
  { id: 'task_google_review_link', label: 'Google Review Link Sent', labelTa: 'Google மதிப்புரை இணைப்பு அனுப்பப்பட்டது' },
  { id: 'task_feedback_form', label: 'Feedback Form Completed', labelTa: 'கருத்துப் படிவம் நிறைவு செய்யப்பட்டது' },
  { id: 'task_unboxing_request', label: 'Unboxing Video Request Sent', labelTa: 'அன்பாக்சிங் வீடியோ கோரிக்கை அனுப்பப்பட்டது' },
  { id: 'task_testimonial_request', label: 'Testimonial Request Sent', labelTa: 'சான்றுரை கோரிக்கை அனுப்பப்பட்டது' },
  { id: 'task_complaints_updated', label: 'Customer Complaints Updated', labelTa: 'வாடிக்கையாளர் புகார்கள் புதுப்பிக்கப்பட்டன' },
  { id: 'task_repeat_tracked', label: 'Repeat Customers Tracked', labelTa: 'மீண்டும் வரும் வாடிக்கையாளர்கள் கண்காணிக்கப்பட்டனர்' },
  { id: 'task_new_tracked', label: 'New Customers Tracked', labelTa: 'புதிய வாடிக்கையாளர்கள் கண்காணிக்கப்பட்டனர்' },
  { id: 'task_review_screenshot', label: 'Google Review Screenshot Shared', labelTa: 'Google மதிப்புரை ஸ்கிரீன்ஷாட் பகிரப்பட்டது' },
  { id: 'task_testimonial_shared', label: 'Customer Testimonial Shared', labelTa: 'வாடிக்கையாளர் சான்றுரை பகிரப்பட்டது' },
  { id: 'task_kpi_sheet', label: 'Daily KPI Sheet Updated', labelTa: 'தினசரி KPI தாள் புதுப்பிக்கப்பட்டது' },
  { id: 'task_packing_story', label: 'Packing Area Story Posted', labelTa: 'பேக்கிங் பகுதி ஸ்டோரி பதிவிடப்பட்டது' },
  { id: 'task_crowd_story', label: 'Crowd / Customer Visit Story Posted', labelTa: 'கூட்டம் / வாடிக்கையாளர் வருகை ஸ்டோரி பதிவிடப்பட்டது' },
  { id: 'task_tip', label: 'Tip of the Day Posted', labelTa: 'இன்றைய குறிப்பு பதிவிடப்பட்டது' },
  { id: 'task_hand_tool', label: 'Hand Tool Post Uploaded', labelTa: 'கைக் கருவி பதிவு பதிவேற்றப்பட்டது' },
  { id: 'task_clearance', label: 'Stock Clearance Post Uploaded', labelTa: 'ஸ்டாக் கிளியரன்ஸ் பதிவு பதிவேற்றப்பட்டது' },
  { id: 'task_restock', label: 'New Product Restock Post Uploaded', labelTa: 'புதிய தயாரிப்பு மறுசரக்கு பதிவு பதிவேற்றப்பட்டது' },
  { id: 'task_link_clicks', label: 'Google Review Link Clicks Tracked', labelTa: 'Google மதிப்புரை இணைப்பு கிளிக்குகள் கண்காணிக்கப்பட்டன' },
  { id: 'task_satisfaction_followup', label: 'Customer Satisfaction Follow-up', labelTa: 'வாடிக்கையாளர் திருப்தி பின்தொடர்தல்' },
  { id: 'task_complaint_followup', label: 'Complaint Resolution Follow-up', labelTa: 'புகார் தீர்வு பின்தொடர்தல்' },
  { id: 'task_media_saved', label: 'Media Files / Screenshots Saved', labelTa: 'மீடியா கோப்புகள் / ஸ்கிரீன்ஷாட்கள் சேமிக்கப்பட்டன' },
  { id: 'task_social_stats', label: 'Social Media Growth Stats Updated', labelTa: 'சமூக ஊடக வளர்ச்சி புள்ளிவிவரங்கள் புதுப்பிக்கப்பட்டன' },
  { id: 'task_eod_report', label: 'End-of-Day Report Submitted', labelTa: 'நாள் இறுதி அறிக்கை சமர்ப்பிக்கப்பட்டது' },
  { id: 'task_tomorrow_plan', label: 'Tomorrow Plan Prepared', labelTa: 'நாளைய திட்டம் தயாரிக்கப்பட்டது' },
];

// ── Social channels (PRD §11.3) ──
const CHANNELS: Array<{ id: string; name: string; platform: string; handle?: string }> = [
  { id: 'chan_instagram', name: 'Instagram', platform: 'instagram', handle: '@vikastoolmart' },
  { id: 'chan_youtube', name: 'YouTube', platform: 'youtube' },
  { id: 'chan_facebook', name: 'Facebook', platform: 'facebook' },
  { id: 'chan_whatsapp', name: 'WhatsApp Community', platform: 'whatsapp' },
  { id: 'chan_pinterest', name: 'Pinterest', platform: 'pinterest' },
];

// ── Seed users (PRD §11.5) ──
const USERS = [
  {
    key: 'admin',
    name: 'Uma Jagadeesh (MD)',
    email: process.env.SEED_ADMIN_EMAIL || 'md@vikastoolmart.test',
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!Admin1',
    role: Role.ADMIN,
    department: 'Leadership',
  },
  {
    key: 'head',
    name: 'Indhumathi',
    email: process.env.SEED_HEAD_EMAIL || 'indhumathi@vikastoolmart.test',
    password: process.env.SEED_HEAD_PASSWORD || 'ChangeMe!Head1',
    role: Role.HEAD,
    department: 'CRE',
  },
  {
    key: 'cre',
    name: 'CRE Executive',
    email: process.env.SEED_CRE_EMAIL || 'cre@vikastoolmart.test',
    password: process.env.SEED_CRE_PASSWORD || 'ChangeMe!Cre1',
    role: Role.CRE,
    department: 'CRE',
  },
];

export async function seedDatabase() {
  // Settings singleton
  await prisma.setting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      wooStoreUrl: process.env.WOO_STORE_URL || null,
      syncCron: process.env.SYNC_CRON || '30 6 * * *',
    },
  });

  // KPIs
  for (let i = 0; i < KPIS.length; i++) {
    const k = KPIS[i];
    await prisma.kpiDefinition.upsert({
      where: { key: k.key },
      update: {
        label: k.label,
        labelTa: k.labelTa,
        type: k.type,
        target: k.target ?? null,
        autoSource: k.autoSource ?? null,
        unit: k.unit ?? null,
        sortOrder: i,
      },
      create: {
        key: k.key,
        label: k.label,
        labelTa: k.labelTa,
        type: k.type,
        target: k.target ?? null,
        autoSource: k.autoSource ?? null,
        unit: k.unit ?? null,
        sortOrder: i,
      },
    });
  }

  // Tasks
  for (let i = 0; i < TASKS.length; i++) {
    const tk = TASKS[i];
    await prisma.taskDefinition.upsert({
      where: { id: tk.id },
      update: { label: tk.label, labelTa: tk.labelTa, sortOrder: i },
      create: { id: tk.id, label: tk.label, labelTa: tk.labelTa, sortOrder: i },
    });
  }

  // Social channels
  for (let i = 0; i < CHANNELS.length; i++) {
    const c = CHANNELS[i];
    await prisma.socialChannel.upsert({
      where: { id: c.id },
      update: { name: c.name, platform: c.platform, handle: c.handle ?? null, sortOrder: i },
      create: { id: c.id, name: c.name, platform: c.platform, handle: c.handle ?? null, sortOrder: i },
    });
  }

  // Users + credential accounts
  const printed: Array<{ role: string; email: string; password: string }> = [];
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, department: u.department },
      create: {
        name: u.name,
        email: u.email,
        emailVerified: true,
        role: u.role,
        department: u.department,
        locale: Locale.en,
        active: true,
      },
    });

    const accountId = `acct_${u.key}`;
    const passwordHash = await hashPassword(u.password);
    await prisma.account.upsert({
      where: { id: accountId },
      update: { password: passwordHash, userId: user.id },
      create: {
        id: accountId,
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: passwordHash,
      },
    });
    printed.push({ role: u.role, email: u.email, password: u.password });
  }

  console.log('\n✅ Seed complete.');
  console.log(`   KPIs: ${KPIS.length}  Tasks: ${TASKS.length}  Channels: ${CHANNELS.length}  Users: ${USERS.length}`);
  console.log('\n──────────── SEED CREDENTIALS (change after first login) ────────────');
  for (const p of printed) {
    console.log(`   ${p.role.padEnd(6)}  ${p.email}  /  ${p.password}`);
  }
  console.log('─────────────────────────────────────────────────────────────────────\n');

  return {
    kpis: KPIS.length,
    tasks: TASKS.length,
    channels: CHANNELS.length,
    users: USERS.length,
    credentials: printed,
  };
}

// Run as a script (e.g. `prisma db seed` / `npm run prisma:seed`) but not when
// imported (e.g. by the /api/bootstrap route).
const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  /seed\.ts$/.test(process.argv[1] ?? '');

if (isDirectRun) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('Seed failed:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
