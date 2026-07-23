export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { DirectoryPreviewTab } from '@/components/exhibitor/DirectoryPreviewTab';
import { isLoggedInSponsorFor } from '@/lib/rbac/exhibitor-viewer';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Props { params: Promise<{ token: string }> }

export default async function ExhibitorPreviewPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsor } = await (admin as any)
    .from('sponsors')
    .select('*, events(id, name, slug)')
    .eq('invite_token', token)
    .single();

  if (!sponsor) notFound();
  if (!(await isPlatformFeatureEnabled('exhibitors'))) notFound();

  // Products power both the preview list and the exhibitor-vs-sponsor mode.
  // Missing table (migration 060 not applied) → clean empty state, never a 500.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('exhibitor_products')
      .select('id, name, description, image_url, is_featured')
      .eq('sponsor_id', sponsor.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    products = data ?? [];
  } catch {
    products = [];
  }

  const event = sponsor.events as { id: string; name: string; slug: string };
  const showDashboardLink = await isLoggedInSponsorFor(event.id);
  const mode: 'sponsor' | 'exhibitor' = sponsor.booth_location || products.length > 0 ? 'exhibitor' : 'sponsor';

  return (
    <ExhibitorShell
      token={token}
      companyName={sponsor.company_name}
      tier={sponsor.tier}
      boothNumber={sponsor.booth_location}
      logoUrl={sponsor.logo_url}
      eventName={event.name}
      eventSlug={event.slug}
      activeTab="preview"
      mode={mode}
      showDashboardLink={showDashboardLink}
    >
      <DirectoryPreviewTab sponsor={sponsor} products={products} />
    </ExhibitorShell>
  );
}
