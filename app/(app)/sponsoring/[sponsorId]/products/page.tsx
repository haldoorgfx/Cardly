export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { ProductsTab } from '@/components/exhibitor/ProductsTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';
import { redirect } from 'next/navigation';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export const metadata = { title: 'Products' };

export default async function SponsorProductsPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}/products`);
  if (!(await isPlatformFeatureEnabled('exhibitors'))) redirect(`/sponsoring/${sponsorId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (createAdminClient() as any)
      .from('exhibitor_products')
      .select('*')
      .eq('sponsor_id', sponsor.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    products = data ?? [];
  } catch {
    products = [];
  }

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
      activeTab="products"
      mode={(sponsor.booth_location || products.length > 0) ? 'exhibitor' : 'sponsor'}
    >
      <ProductsTab products={products} token={sponsor.invite_token} />
    </ExhibitorShell>
  );
}
