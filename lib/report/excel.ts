import * as XLSX from 'xlsx';
import type { DailyReport, SummaryReport } from './data';

// Excel exports (PRD §10/§15). Returns a Buffer for streaming as a download.

export function dailyWorkbook(report: DailyReport): Buffer {
  const wb = XLSX.utils.book_new();

  const meta = [
    ['Vikas Tool Mart - CRE Daily Report'],
    ['CRE', report.user.name],
    ['Role', report.user.role],
    ['Date', report.date],
    ['Submitted', report.submitted ? 'Yes' : 'No'],
    [],
    ['Achievement', report.reflections.achievement],
    ['Issues', report.reflections.issues],
    ['Commitment', report.reflections.commitment],
    ['Notes', report.reflections.notes],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meta), 'Summary');

  const kpiRows = [
    ['KPI', 'Value', 'Source', 'Target', 'Unit'],
    ...report.kpis.map((k) => [k.label, k.value ?? '', k.source, k.target ?? '', k.unit ?? '']),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiRows), 'KPIs');

  const taskRows = [['Task', 'Done'], ...report.tasks.map((t) => [t.label, t.done ? 'Yes' : 'No'])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(taskRows), 'Tasks');

  const socialRows = [
    ['Channel', 'Yesterday', 'Today', 'Change'],
    ...report.social.map((s) => [s.name, s.yesterday ?? '', s.today ?? '', s.change ?? '']),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(socialRows), 'Social');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function summaryWorkbook(report: SummaryReport): Buffer {
  const wb = XLSX.utils.book_new();

  const metrics = [
    ['Vikas Tool Mart - Management Summary'],
    ['Range', report.range.label],
    ['Generated', report.generatedAt],
    [],
    ['Metric', 'Value', 'Source'],
    ['Average rating (/10)', report.avgRating.value ?? '', report.avgRating.source],
    ['Reviews received', report.reviewsReceived.value ?? '', report.reviewsReceived.source],
    ['Open complaints', report.complaintsOpen.value ?? '', report.complaintsOpen.source],
    ['Resolved complaints', report.complaintsResolved.value ?? '', report.complaintsResolved.source],
    ['New customers', report.newCustomers.value ?? '', report.newCustomers.source],
    ['Repeat customers', report.repeatCustomers.value ?? '', report.repeatCustomers.source],
    ['Follower growth', report.followerGrowth.value ?? '', report.followerGrowth.source],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metrics), 'Metrics');

  const acct = [
    ['CRE', 'Role', 'Submitted days', 'Tasks %', 'KPIs filled (avg)'],
    ...report.accountability.map((a) => [a.name, a.role, a.submittedDays, a.tasksPct, a.kpisFilledAvg]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(acct), 'Accountability');

  const series = [['Date', 'Reviews'], ...report.reviewsSeries.map((s) => [s.date, s.count])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(series), 'Reviews by day');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
