export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { LeadsTab } from '@/components/exhibitor/LeadsTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';

export const metadata = { title: 'Leads' };

export default async function SponsorLeadsPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}/leads`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leads } = await (createAdminClient() as any)
    .from('sponsor_leads')
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
      activeTab="leads"
      mode={sponsor.booth_location ? 'exhibitor' : 'sponsor'}
    >
      <LeadsTab leads={leads ?? []} token={sponsor.invite_token} />
    </ExhibitorShell>
  );
}
