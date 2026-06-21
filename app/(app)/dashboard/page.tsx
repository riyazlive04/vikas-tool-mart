import { requireRole } from '@/lib/auth/session';
import { Placeholder } from '@/components/ui/Placeholder';

export default async function DashboardPage() {
  await requireRole(['ADMIN', 'HEAD']);
  return <Placeholder title="Management Dashboard" note="Phase 10 adds source-tagged metrics." />;
}
