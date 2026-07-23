export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { ResourcesTab } from '@/components/exhibitor/ResourcesTab';
import { isLoggedInSponsorFor } from '@/lib/rbac/exhibitor-viewer';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Props { params: Promise<{ token: string }> }

export default async function ExhibitorResourcesPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsor } = await (admin as any)
    .from('sponsors')
    .select('id, company_name, tier, booth_location, logo_url, events(id, name, slug)')
    .eq('invite_token', token)
    .single();

  if (!sponsor) notFound();
  if (!(await isPlatformFeatureEnabled('exhibitors'))) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resources } = await (admin as any)
    .from('sponsor_resources')
    .select('*')
    .eq('sponsor_id', sponsor.id)
    .order('created_at', { ascending: false });

  const event = sponsor.events as { id: string; name: string; slug: string };
  const showDashboardLink = await isLoggedInSponsorFor(event.id);

  return (
    <ExhibitorShell
      token={token}
      companyName={sponsor.company_name}
      tier={sponsor.tier}
      boothNumber={sponsor.booth_location}
      logoUrl={sponsor.logo_url}
      eventName={event.name}
      eventSlug={event.slug}
      activeTab="resources"
      mode={sponsor.booth_location ? 'exhibitor' : 'sponsor'}
      showDashboardLink={showDashboardLink}
    >
      <ResourcesTab resources={resources ?? []} token={token} />
    </ExhibitorShell>
  );
}
