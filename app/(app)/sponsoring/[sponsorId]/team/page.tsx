export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { TeamTab } from '@/components/exhibitor/TeamTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';

export const metadata = { title: 'Team' };

export default async function SponsorTeamPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}/team`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (createAdminClient() as any)
    .from('sponsor_members')
    .select('id, invited_email, role, status, user_id, profiles(full_name, email)')
    .eq('sponsor_id', sponsor.id)
    .order('created_at', { ascending: true });

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
      activeTab="team"
    >
      <TeamTab members={members ?? []} token={sponsor.invite_token} />
    </ExhibitorShell>
  );
}
