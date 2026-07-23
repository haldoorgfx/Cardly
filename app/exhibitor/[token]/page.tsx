export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { OverviewTab } from '@/components/exhibitor/OverviewTab';
import { isLoggedInSponsorFor } from '@/lib/rbac/exhibitor-viewer';
import { ownedSponsor } from '@/lib/rbac/ownership';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Props { params: Promise<{ token: string }> }

export default async function ExhibitorPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // Resolve sponsor by invite token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsor } = await (admin as any)
    .from('sponsors')
    .select('*, events!inner(id, name, slug, status)')
    .eq('invite_token', token)
    .single();

  if (!sponsor || !sponsor.events) notFound();
  if (!(await isPlatformFeatureEnabled('exhibitors'))) notFound();

  const event = sponsor.events as { id: string; name: string; slug: string; status: string };

  // A logged-in OWNER of this sponsor record has a native dashboard workspace —
  // send them there. Anonymous tokenholders (and team members) keep the token
  // portal exactly as before.
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const owned = await ownedSponsor(user.id, sponsor.id);
      if (owned) redirect(`/sponsoring/${sponsor.id}`);
    }
  } catch (err) {
    // redirect() throws NEXT_REDIRECT — re-throw it; anything else is best-effort.
    if (err && typeof err === 'object' && 'digest' in err) throw err;
  }

  // Stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const [{ count: leadCount }, { count: resourceCount }, { count: meetingCount }, { data: leads }] = await Promise.all([
    db.from('sponsor_leads').select('id', { count: 'exact', head: true }).eq('sponsor_id', sponsor.id),
    db.from('sponsor_resources').select('id', { count: 'exact', head: true }).eq('sponsor_id', sponsor.id),
    db.from('meeting_requests').select('id', { count: 'exact', head: true }).eq('sponsor_id', sponsor.id).eq('status', 'scheduled'),
    db.from('sponsor_leads').select('rating').eq('sponsor_id', sponsor.id),
  ]);

  const allLeads = (leads ?? []) as Array<{ rating: string }>;
  const hot  = allLeads.filter(l => l.rating === 'hot').length;
  const warm = allLeads.filter(l => l.rating === 'warm').length;
  const cold = allLeads.filter(l => l.rating === 'cold').length;

  const stats = {
    leads: leadCount ?? 0,
    resources: resourceCount ?? 0,
    meetings: meetingCount ?? 0,
    hot, warm, cold,
  };

  // Additive: only true for a logged-in sponsor of this event; anonymous token
  // visitors resolve to false and the token flow is unchanged.
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
      activeTab="overview"
      mode={sponsor.booth_location ? 'exhibitor' : 'sponsor'}
      showDashboardLink={showDashboardLink}
    >
      <OverviewTab
        sponsorId={sponsor.id}
        token={token}
        stats={stats}
        boothNumber={sponsor.booth_location}
        eventName={event.name}
      />
    </ExhibitorShell>
  );
}
