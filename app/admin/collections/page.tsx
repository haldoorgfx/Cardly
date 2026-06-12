export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { OperatorCollectionsClient } from '@/components/admin/OperatorCollectionsClient';

export const metadata = { title: 'Marketplace Collections — Operator' };

export default async function CollectionsPage() {
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
