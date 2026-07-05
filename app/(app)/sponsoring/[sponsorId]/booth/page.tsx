export const dynamic = 'force-dynamic';

import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { BoothTab } from '@/components/exhibitor/BoothTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';

export const metadata = { title: 'Booth profile' };

export default async function SponsorBoothPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}/booth`);

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
      activeTab="booth"
    >
      <BoothTab sponsor={sponsor} token={sponsor.invite_token} />
    </ExhibitorShell>
  );
}
