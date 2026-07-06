export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { DirectoryPreviewTab } from '@/components/exhibitor/DirectoryPreviewTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';

export const metadata = { title: 'Directory preview' };

export default async function SponsorPreviewPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}/preview`);

  // Products power both the preview list and the exhibitor-vs-sponsor mode.
  // Missing table (migration 060 not applied) → clean empty state, never a 500.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (createAdminClient() as any)
      .from('exhibitor_products')
      .select('id, name, description, image_url, is_featured')
      .eq('sponsor_id', sponsor.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    products = data ?? [];
  } catch {
    products = [];
  }

  const mode: 'sponsor' | 'exhibitor' = sponsor.booth_location || products.length > 0 ? 'exhibitor' : 'sponsor';

  return (
    <ExhibitorShell
      token={sponsor.invite_token}
      hrefBase={`/sponsoring/${sponsor.id}`}
      companyName={sponsor.company_name}
      tier={sponsor.tier}
      boothNumber={sponsor.booth_location}
      logoUrl={sponsor.logo_url}
      eventName={event.name}
      eventSlug={event.slug}
      activeTab="preview"
      mode={mode}
    >
      <DirectoryPreviewTab sponsor={sponsor} products={products} />
    </ExhibitorShell>
  );
}
