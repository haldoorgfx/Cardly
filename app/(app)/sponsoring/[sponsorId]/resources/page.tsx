export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { ResourcesTab } from '@/components/exhibitor/ResourcesTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';
import { redirect } from 'next/navigation';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export const metadata = { title: 'Resources' };

export default async function SponsorResourcesPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}/resources`);
  if (!(await isPlatformFeatureEnabled('exhibitors'))) redirect(`/sponsoring/${sponsorId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resources } = await (createAdminClient() as any)
    .from('sponsor_resources')
    .select('*')
    .eq('sponsor_id', sponsor.id)
    .order('created_at', { ascending: false });

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
      activeTab="resources"
      mode={sponsor.booth_location ? 'exhibitor' : 'sponsor'}
    >
      <ResourcesTab resources={resources ?? []} token={sponsor.invite_token} />
    </ExhibitorShell>
  );
}
