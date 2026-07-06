export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { OverviewTab } from '@/components/exhibitor/OverviewTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';

export const metadata = { title: 'Sponsor workspace' };

export default async function SponsorWorkspacePage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const [{ count: leadCount }, { count: resourceCount }, { data: leads }] = await Promise.all([
    db.from('sponsor_leads').select('id', { count: 'exact', head: true }).eq('sponsor_id', sponsor.id),
    db.from('sponsor_resources').select('id', { count: 'exact', head: true }).eq('sponsor_id', sponsor.id),
    db.from('sponsor_leads').select('rating').eq('sponsor_id', sponsor.id),
  ]);

  const allLeads = (leads ?? []) as Array<{ rating: string }>;
  const stats = {
    leads: leadCount ?? 0,
    resources: resourceCount ?? 0,
    hot: allLeads.filter(l => l.rating === 'hot').length,
    warm: allLeads.filter(l => l.rating === 'warm').length,
    cold: allLeads.filter(l => l.rating === 'cold').length,
  };

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
      activeTab="overview"
      mode={sponsor.booth_location ? 'exhibitor' : 'sponsor'}
    >
      <OverviewTab
        sponsorId={sponsor.id}
        token={sponsor.invite_token}
        stats={stats}
        boothNumber={sponsor.booth_location}
        eventName={event.name}
      />
    </ExhibitorShell>
  );
}
