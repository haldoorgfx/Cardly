export const dynamic = 'force-dynamic';

import { requirePermission } from '@/lib/auth/guards';
import { EVENT_VIEW_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { OperatorCollectionsClient } from '@/components/admin/OperatorCollectionsClient';

export const metadata = { title: 'Marketplace Collections — Operator' };

export default async function CollectionsPage() {
  // This was the only admin page with no permission check of its own — it
  // relied on the layout alone, and layouts render in parallel with pages, so
  // the service-role queries below ran before the redirect landed. Every
  // sibling oversight page gates here too, and the approve/reject route this
  // page drives is EVENT_EDIT_ALL (super_admin), so a plain admin could see a
  // review queue it could never act on.
  await requirePermission(EVENT_VIEW_ALL);

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Load collections
  const { data: collections } = await adminAny
    .from('marketplace_collections')
    .select('*')
    .order('sort_order', { ascending: true });

  // Load promoted listings pending review
  const { data: promoted } = await adminAny
    .from('promoted_listings')
    .select('*, event_pages(title, cover_image_url, starts_at, city, venue_name)')
    .eq('status', 'pending_review')
    .order('submitted_at', { ascending: true });

  return (
    <OperatorCollectionsClient
      collections={collections ?? []}
      promoted={promoted ?? []}
    />
  );
}
