import { getTranslations } from 'next-intl/server';
import { requireUser } from '@/lib/auth/session';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';

export default async function NewComplaintPage({
  searchParams,
}: {
  searchParams: { orderRef?: string; customer?: string };
}) {
  await requireUser();
  const t = await getTranslations('complaints');

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-gold">{t('new')}</h1>
      <ComplaintForm
        prefill={{ orderRef: searchParams.orderRef ?? '', customer: searchParams.customer ?? '' }}
      />
    </div>
  );
}
