export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { OverviewTab } from '@/components/exhibitor/OverviewTab';

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

  const event = sponsor.events as { id: string; name: string; slug: string; status: string };

  // Stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const [{ count: leadCount }, { count: resourceCount }, { data: leads }] = await Promise.all([
    db.from('sponsor_leads').select('id', { count: 'exact', head: true }).eq('sponsor_id', sponsor.id),
    db.from('sponsor_resources').select('id', { count: 'exact', head: true }).eq('sponsor_id', sponsor.id),
    db.from('sponsor_leads').select('rating').eq('sponsor_id', sponsor.id),
  ]);

  const allLeads = (leads ?? []) as Array<{ rating: string }>;
  const hot  = allLeads.filter(l => l.rating === 'hot').length;
  const warm = allLeads.filter(l => l.rating === 'warm').length;
  const cold = allLeads.filter(l => l.rating === 'cold').length;

  const stats = {
    leads: leadCount ?? 0,
    resources: resourceCount ?? 0,
    hot, warm, cold,
  };

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
