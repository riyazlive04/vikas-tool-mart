/* Build the VTM CROS user guide PDF from the captured screenshots.
 *   npx tsx scripts/screenshots.ts && npx tsx scripts/user-guide.tsx
 * Output: docs/VTM-CROS-User-Guide.pdf
 */
import React from 'react';
import { Document, Page, Text, View, Image, Link, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { readFileSync, writeFileSync } from 'node:fs';

const SHOTS = 'docs/screenshots';
const OUT = 'docs/VTM-CROS-User-Guide.pdf';
const C = { gold: '#F5C400', ink: '#1A1A1A', muted: '#555', line: '#E2E2E2', card: '#F7F7F7' };

const s = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 34, paddingHorizontal: 30, fontSize: 10.5, color: C.ink, fontFamily: 'Helvetica', lineHeight: 1.4 },
  band: { backgroundColor: C.gold, borderRadius: 5, padding: '6 10', marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bandRole: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ink },
  h1: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  h2: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  p: { marginBottom: 4 },
  bullet: { flexDirection: 'row', marginBottom: 2 },
  dot: { width: 10, color: C.gold, fontFamily: 'Helvetica-Bold' },
  fig: { marginTop: 8, alignSelf: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 4 },
  footer: { position: 'absolute', bottom: 16, left: 30, right: 30, fontSize: 8, color: C.muted, flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: C.card, borderRadius: 5, padding: 10, marginBottom: 8 },
  th: { fontFamily: 'Helvetica-Bold' },
});

function pngSize(buf: Buffer): { w: number; h: number } {
  // PNG IHDR: width @16, height @20 (big-endian uint32).
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function figure(file: string, targetH: number) {
  const buf = readFileSync(`${SHOTS}/${file}`);
  const { w, h } = pngSize(buf);
  const height = targetH;
  const width = Math.round(height * (w / h));
  const src = `data:image/png;base64,${buf.toString('base64')}`;
  return <Image src={src} style={[s.fig, { width, height }]} />;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ marginBottom: 4 }}>
      {items.map((t, i) => (
        <View style={s.bullet} key={i}>
          <Text style={s.dot}>•</Text>
          <Text style={{ flex: 1 }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>Vikas Tool Mart - CROS User Guide</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function FeaturePage({ role, title, intro, steps, file, mobile }: {
  role: string; title: string; intro: string; steps: string[]; file: string; mobile: boolean;
}) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.band}>
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>VIKAS TOOL MART · CROS</Text>
        <Text style={s.bandRole}>{role}</Text>
      </View>
      <Text style={s.h2}>{title}</Text>
      <Text style={s.p}>{intro}</Text>
      <Bullets items={steps} />
      {figure(file, mobile ? 540 : 470)}
      <Footer />
    </Page>
  );
}

const FEATURES: Array<{ role: string; title: string; intro: string; steps: string[]; file: string; mobile: boolean }> = [
  {
    role: 'ALL USERS', title: '1. Signing in', file: '01-login.png', mobile: true,
    intro: 'Open the app URL on any phone or computer and sign in with the email + password your admin created.',
    steps: [
      'Enter your email and password, then tap “Sign in to CROS”.',
      'Switch the interface language any time with the EN / த toggle (top-right).',
      'Your role (CRE, Head, or Admin) decides which tabs you can see.',
      'Change your password after first login (Admin can reset it for you).',
    ],
  },
  {
    role: 'CRE', title: '2. Daily Workbook - KPIs', file: '02-cre-workbook-kpis.png', mobile: true,
    intro: 'Your day on one screen. KPIs marked “Auto” are filled from WooCommerce and your worklist taps; you only type what is genuinely manual.',
    steps: [
      'Pick the date at the top; the day is pre-filled from sync + worklist actions.',
      'Auto KPIs show a green “Auto” tag - tap the number to override, then “revert” to restore.',
      'Tick check-type KPIs (e.g., “Tip of the Day Posted”); type counts where needed.',
      'Fill Achievement / Issues / Commitment; everything auto-saves on blur.',
      'Progress bars show tasks done and KPIs filled. Tap “Submit” when done.',
    ],
  },
  {
    role: 'CRE', title: '3. Daily Workbook - Tasks, Social & Notes', file: '03-cre-workbook-tasks.png', mobile: true,
    intro: 'The Tasks tab is your daily checklist; Social tracks follower counts; Notes holds free text.',
    steps: [
      'Tap any task to mark it done - the progress bar updates instantly.',
      'On the Social tab, enter yesterday/today counts; the change is computed for you.',
      'Tasks and channels are configured by your admin, so the list stays current.',
    ],
  },
  {
    role: 'CRE', title: '4. Order Worklist - one-tap actions', file: '04-cre-worklist.png', mobile: true,
    intro: 'The heart of the system. Each morning the day’s WooCommerce orders appear here. Working the list updates your KPI counts automatically - no typing.',
    steps: [
      'Tap “Contacted”, “Review requested”, “Unboxing requested”, or “Testimonial requested” per order.',
      'Each tap turns green and increments the matching KPI on your workbook.',
      'Search by order # or customer; filter by order status.',
      'Tap “Log complaint” to raise a complaint pre-linked to that order.',
    ],
  },
  {
    role: 'CRE', title: '5. Complaints', file: '05-cre-complaints.png', mobile: true,
    intro: 'Track every customer complaint from Open to Resolved. Logging one automatically feeds the complaint KPIs.',
    steps: [
      'Filter by status (All / Open / In progress / Resolved).',
      'Tap “Manage” to change status, set a follow-up date, or add resolution notes.',
      'CREs see complaints they logged; Heads/Admin see all and can assign owners.',
    ],
  },
  {
    role: 'CRE', title: '6. Logging a complaint', file: '06-cre-complaint-new.png', mobile: true,
    intro: 'Capture a complaint in seconds. Linking a Woo order is optional but helps tracking.',
    steps: [
      'Enter customer name (pre-filled when opened from the worklist).',
      'Pick a category (Warranty / Defect / Delivery / Product / Other).',
      'Start typing an order # or customer to search and link a Woo order.',
      'Describe the issue and save - it appears in the Complaints list immediately.',
    ],
  },
  {
    role: 'CRE', title: '7. Reports & Export', file: '07-cre-reports.png', mobile: true,
    intro: 'Download an auto-compiled report of your day as PDF or Excel.',
    steps: [
      'Choose “Daily report” and the date.',
      'Tap “Download PDF” or “Download Excel”.',
      'Heads/Admin can also export a management summary over a date range.',
    ],
  },
  {
    role: 'HEAD / ADMIN', title: '8. Management Dashboard', file: '10-dashboard.png', mobile: false,
    intro: 'A trustworthy, real-time view for leadership. Every metric is tagged Auto (from the store/system) or Manual.',
    steps: [
      'Switch the range: Today / Week / Month, or pick a custom range.',
      'Read avg rating, reviews, complaints open vs resolved, new vs repeat customers, follower growth.',
      'The reviews chart shows on-site reviews per day.',
      'The CRE Accountability table shows who submitted, task %, and KPIs filled.',
      'A banner appears if the last sync failed - data stays available regardless.',
    ],
  },
  {
    role: 'ADMIN', title: '9. Admin overview', file: '11-admin-home.png', mobile: false,
    intro: 'Everything configurable lives here - no developer needed.',
    steps: ['Manage Users, WooCommerce, KPIs, Tasks, and Social channels from one place.'],
  },
  {
    role: 'ADMIN', title: '10. User management', file: '12-admin-users.png', mobile: false,
    intro: 'Create staff accounts and control access.',
    steps: [
      'Add a user with a role (Admin / Head / CRE), department, and temporary password.',
      'Edit roles, deactivate accounts, or reset passwords.',
      'Set each user’s default language (English or Tamil).',
    ],
  },
  {
    role: 'ADMIN', title: '11. WooCommerce settings & sync', file: '13-admin-woo.png', mobile: false,
    intro: 'Connect the live store using read-only API keys. Keys are encrypted and never shown again.',
    steps: [
      'Enter the store URL + consumer key/secret (WooCommerce → Settings → Advanced → REST API, Read permission).',
      'Tap “Test connection”, then “Save”.',
      'Use “Sync now” for an immediate pull; the worker also syncs on the schedule (cron).',
      'Google reviews stay manual in Phase 1 (auto-pull is a future upgrade).',
    ],
  },
  {
    role: 'ADMIN', title: '12. Configure KPIs (and Tasks / Channels)', file: '14-admin-kpis.png', mobile: false,
    intro: 'Tailor the workbook to how VTM works - add, edit, reorder, or disable items without code.',
    steps: [
      'Add a KPI with EN/TA labels, type, target, and unit.',
      'Set an auto source (e.g., new customers, worklist contacted) or leave it manual.',
      'Reorder with ↑ / ↓; toggle Off to hide without deleting.',
      'Tasks and Social channels are managed the same way.',
    ],
  },
];

async function build() {
  const doc = (
    <Document title="Vikas Tool Mart - CROS User Guide" author="Sirah Digital">
      {/* Cover */}
      <Page size="A4" style={s.page}>
        <View style={{ marginTop: 120, alignItems: 'center' }}>
          <View style={{ backgroundColor: C.gold, borderRadius: 8, paddingVertical: 16, paddingHorizontal: 28 }}>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', letterSpacing: 3, textAlign: 'center' }}>VIKAS TOOL MART</Text>
            <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 4 }}>CROS User Guide</Text>
          </View>
          <Text style={{ marginTop: 18, fontSize: 12, color: C.muted }}>Customer & Reputation Operations System</Text>
          <Text style={{ marginTop: 6, fontSize: 10, color: C.muted }}>Daily Workbook · Order Worklist · Complaints · Dashboard</Text>
          <Text style={{ marginTop: 40, fontSize: 9, color: C.muted }}>For CRE Executives, Department Heads, and Admins</Text>
          <Text style={{ marginTop: 4, fontSize: 9, color: C.muted }}>
            Prepared by{' '}
            <Link src="https://sirahdigital.in/" style={{ color: C.muted, textDecoration: 'none' }}>Sirah Digital</Link>
          </Text>
        </View>
        <Footer />
      </Page>

      {/* Getting started */}
      <Page size="A4" style={s.page}>
        <View style={s.band}><Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11 }}>GETTING STARTED</Text><Text style={s.bandRole}>ALL USERS</Text></View>
        <Text style={s.h2}>What is CROS?</Text>
        <Text style={s.p}>
          CROS is Vikas Tool Mart’s cloud system for the Customer Relationship (CRE) team. It reads your live
          WooCommerce store to fill in daily numbers automatically, lets you work the day’s orders with one-tap
          actions, tracks complaints, and gives leadership a real-time dashboard. It works in English and Tamil,
          and is built for phones first.
        </Text>
        <View style={s.card}>
          <Text style={s.th}>The one idea that makes it fast</Text>
          <Text>Reduce manual entry - but keep it always possible. Anything the store knows is auto-filled; every
            auto value can still be edited by hand, and the app works fully even if sync is off.</Text>
        </View>
        <Text style={s.h2}>Roles at a glance</Text>
        <Bullets items={[
          'CRE - Daily Workbook, Order Worklist, log Complaints, own Reports.',
          'Head - everything a CRE can do, plus the Management Dashboard, all complaints, and summaries.',
          'Admin - everything, plus configuration: users, WooCommerce, KPIs, tasks, and channels.',
        ]} />
        <View style={s.card}>
          <Text style={s.th}>First-time sign-in</Text>
          <Text>Use the credentials your admin shares. Change your password after first login. Tap EN / த any time
            to switch language. If you forget your password, an admin can reset it from Admin → Users.</Text>
        </View>
        <Footer />
      </Page>

      {FEATURES.map((f, i) => <FeaturePage key={i} {...f} />)}
    </Document>
  );

  const buf = await renderToBuffer(doc);
  writeFileSync(OUT, buf);
  console.log(`User guide written to ${OUT} (${(buf.length / 1024).toFixed(0)} KB, ${FEATURES.length + 2} sections)`);
}

build().catch((e) => { console.error(e); process.exit(1); });
