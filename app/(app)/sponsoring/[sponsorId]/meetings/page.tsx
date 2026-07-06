export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { MeetingsTab } from '@/components/exhibitor/MeetingsTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';

export const metadata = { title: 'Meetings' };

export default async function SponsorMeetingsPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}/meetings`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let meetings: any[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (createAdminClient() as any)
      .from('meeting_requests')
      .select('*')
      .eq('sponsor_id', sponsor.id)
      .order('created_at', { ascending: false });
    meetings = data ?? [];
  } catch {
    meetings = [];
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
      activeTab="meetings"
    >
      <MeetingsTab meetings={meetings} token={sponsor.invite_token} />
    </ExhibitorShell>
  );
}
