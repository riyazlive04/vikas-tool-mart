import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { TaskManager } from '@/components/admin/TaskManager';

export const dynamic = 'force-dynamic';

export default async function AdminTasksPage() {
  await requireRole(['ADMIN']);
  const tasks = await prisma.taskDefinition.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-gold">Tasks</h1>
      <TaskManager tasks={tasks.map((t) => ({ id: t.id, label: t.label, labelTa: t.labelTa, active: t.active }))} />
    </div>
  );
}
