export const dynamic = 'force-dynamic';

import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { BoothTab } from '@/components/exhibitor/BoothTab';
import { requireSponsorWorkspace } from '@/lib/rbac/sponsorWorkspace';
import { redirect } from 'next/navigation';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export const metadata = { title: 'Booth profile' };

export default async function SponsorBoothPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const { sponsorId } = await params;
  const { sponsor, event } = await requireSponsorWorkspace(sponsorId, `/sponsoring/${sponsorId}/booth`);
  // Booth profile is an exhibitor concept (booth number, floor presence) —
  // plain logo-tier sponsors never had one, so the 'exhibitors' kill-switch
  // gates this tab and Products, but not the shared Overview/Meetings/
  // Resources/Team tabs every sponsor uses regardless of tier.
  if (!(await isPlatformFeatureEnabled('exhibitors'))) redirect(`/sponsoring/${sponsorId}`);

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
      mode={sponsor.booth_location ? 'exhibitor' : 'sponsor'}
    >
      <BoothTab sponsor={sponsor} token={sponsor.invite_token} />
    </ExhibitorShell>
  );
}
