import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { UserManager } from '@/components/admin/UserManager';

export default async function AdminUsersPage() {
  const admin = await requireRole(['ADMIN']);
  const users = await prisma.user.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      locale: true,
      active: true,
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-gold">Users</h1>
      <UserManager users={users} currentUserId={admin.id} />
    </div>
  );
}
