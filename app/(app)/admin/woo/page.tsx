import { requireRole } from '@/lib/auth/session';
import { getSettings } from '@/lib/settings';
import { WooSettingsForm } from '@/components/admin/WooSettingsForm';
import { SyncNowButton } from '@/components/sync/SyncNowButton';
import { SyncStatus } from '@/components/sync/SyncStatus';

export default async function AdminWooPage() {
  await requireRole(['ADMIN']);
  const s = await getSettings();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-gold">WooCommerce</h1>
        <SyncNowButton compact />
      </div>

      <div className="vtm-card">
        <SyncStatus />
      </div>

      <WooSettingsForm
        initial={{
          wooStoreUrl: s.wooStoreUrl ?? '',
          hasKey: !!s.wooKey,
          hasSecret: !!s.wooSecret,
          syncCron: s.syncCron,
          reviewSource: s.reviewSource,
          googleReviewsAuto: s.googleReviewsAuto,
        }}
      />

      <p className="text-[11px] text-muted">
        Keys are stored encrypted (AES-256-GCM) and never displayed again. Generate read-only keys in
        WooCommerce → Settings → Advanced → REST API.
      </p>
    </div>
  );
}
