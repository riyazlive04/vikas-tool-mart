import { requireRole } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { ChannelManager } from '@/components/admin/ChannelManager';

export const dynamic = 'force-dynamic';

export default async function AdminChannelsPage() {
  await requireRole(['ADMIN']);
  const channels = await prisma.socialChannel.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-gold">Social channels</h1>
      <ChannelManager channels={channels.map((c) => ({ id: c.id, name: c.name, platform: c.platform, handle: c.handle, active: c.active }))} />
    </div>
  );
}
