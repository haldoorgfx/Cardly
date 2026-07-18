import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props { params: Promise<{ id: string }> }

// Virtual / livestream is not shipped yet. The previous page had inert
// "Go live" / "Configure stream" controls and no streaming backend, so it's
// hidden from the event nav and deep-links fall back to the event overview.
export default async function VirtualPage({ params }: Props) {
  const { id: ref } = await params;
  const ev = await resolveEventRef(ref);
  redirect(ev ? `/events/${ev.slug}` : '/dashboard');
}
