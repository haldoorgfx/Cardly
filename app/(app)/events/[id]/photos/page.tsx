export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PhotoWallAdmin } from '@/components/events/PhotoWallAdmin';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

export async function generateMetadata() {
  return { title: 'Photo Wall' };
}

export default async function PhotoWallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: photos } = await (admin as any)
    .from('event_photos')
    .select('id, attendee_name, image_url, caption, status, likes, day_label, created_at')
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  return (
    <PhotoWallAdmin
      eventId={id}
      eventName={event.name}
      initialPhotos={photos ?? []}
    />
  );
}
