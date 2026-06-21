import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser, canManage } from '@/lib/auth/session';
import { getDailyReport, getSummaryReport } from '@/lib/report/data';
import { dailyWorkbook, summaryWorkbook } from '@/lib/report/excel';
import { renderDailyPdf, renderSummaryPdf } from '@/lib/report/pdf';
import { resolveRange } from '@/lib/dashboard';
import { toDateOnly, isoDate } from '@/lib/dates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // PDF/Excel generation headroom on serverless

const PDF = 'application/pdf';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// GET /api/export?format=pdf|excel&scope=daily|summary&date=&userId=&range=&from=&to=
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const format = sp.get('format') === 'excel' ? 'excel' : 'pdf';
  const scope = sp.get('scope') === 'summary' ? 'summary' : 'daily';

  try {
    if (scope === 'summary') {
      if (!canManage(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const range = resolveRange(sp.get('range') ?? undefined, sp.get('from') ?? undefined, sp.get('to') ?? undefined);
      const report = await getSummaryReport(range);
      const name = `vtm-summary-${range.key}-${report.generatedAt}`;
      if (format === 'excel') return file(summaryWorkbook(report), `${name}.xlsx`, XLSX_MIME);
      return file(await renderSummaryPdf(report), `${name}.pdf`, PDF);
    }

    // daily
    const dateStr = sp.get('date');
    const date = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? toDateOnly(new Date(dateStr + 'T00:00:00Z')) : toDateOnly(new Date());
    // CRE can only export their own day; Head/Admin can export anyone's.
    const targetUserId = sp.get('userId') || user.id;
    if (targetUserId !== user.id && !canManage(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const report = await getDailyReport(targetUserId, date);
    const name = `vtm-daily-${report.user.name.replace(/\s+/g, '_')}-${isoDate(date)}`;
    if (format === 'excel') return file(dailyWorkbook(report), `${name}.xlsx`, XLSX_MIME);
    return file(await renderDailyPdf(report), `${name}.pdf`, PDF);
  } catch (err) {
    console.error('[export] failed', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function file(buf: Buffer, filename: string, contentType: string) {
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
