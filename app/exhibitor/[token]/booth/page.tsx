export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ExhibitorShell } from '@/components/exhibitor/ExhibitorShell';
import { BoothTab } from '@/components/exhibitor/BoothTab';

interface Props { params: Promise<{ token: string }> }

export default async function ExhibitorBoothPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsor } = await (admin as any)
    .from('sponsors')
    .select('*, events(name, slug)')
    .eq('invite_token', token)
    .single();

  if (!sponsor) notFound();

  const event = sponsor.events as { name: string; slug: string };

  return (
    <ExhibitorShell
      token={token}
      companyName={sponsor.company_name}
      tier={sponsor.tier}
      boothNumber={sponsor.booth_location}
      logoUrl={sponsor.logo_url}
      eventName={event.name}
      eventSlug={event.slug}
      activeTab="booth"
    >
      <BoothTab sponsor={sponsor} token={token} />
    </ExhibitorShell>
  );
}
