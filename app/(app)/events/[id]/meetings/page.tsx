import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props { params: Promise<{ id: string }> }

// 1:1 Meetings is not shipped yet. The previous page was a non-functional
// placeholder (no API, fabricated schedule data, inert controls), so it's
// hidden from the event nav and deep-links fall back to the event overview.
// MeetingsClient.tsx is kept on disk for a future real implementation.
export default async function MeetingsPage({ params }: Props) {
  const { id: ref } = await params;
  const ev = await resolveEventRef(ref);
  redirect(ev ? `/events/${ev.slug}` : '/dashboard');
}
