export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { SpeedNetworkingClient } from '@/components/events/SpeedNetworkingClient';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

export default async function SpeedNetworkingPage({ params, searchParams }: Props) {
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;
  // Speed networking is part of the "networking" section; 404 when disabled.
  if (!isSectionEnabled(await getEventFeatures(event.id), 'networking')) notFound();

  const registrationId = await resolveViewerRegistrationId(event.id, searchParams.reg);

  // /api/events/[id]/connections now requires this registration's own
  // qr_code_token to prove guest identity (a bare registration id is no
  // longer sufficient — see lib/attendee-identity.ts).
  let qrToken: string | null = null;
  if (registrationId) {
    const admin = createAdminClient();
    const { data: viewerReg } = await admin
      .from('registrations')
      .select('qr_code_token')
      .eq('id', registrationId)
      .maybeSingle();
    qrToken = viewerReg?.qr_code_token ?? null;
  }

  return (
    <SpeedNetworkingClient
      eventId={event.id}
      eventName={eventPageTitle ?? event.name}
      eventSlug={params.slug}
      registrationId={registrationId}
      qrToken={qrToken}
    />
  );
}
