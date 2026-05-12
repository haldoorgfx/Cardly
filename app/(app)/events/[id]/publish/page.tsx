import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PublishClient from './PublishClient';
import type { Zone } from '@/types/database';

export default async function PublishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  let slug = event.slug;
  if (event.status !== 'published') {
    const { data: updated } = await admin
      .from('events')
      .update({ status: 'published' })
      .eq('id', id)
      .select('slug')
      .single();
    if (updated) slug = updated.slug;
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/c/${slug}`;
  const zones = (event.zones as unknown as Zone[]) ?? [];

  return (
    <PublishClient
      eventId={id}
      eventName={event.name}
      shareUrl={shareUrl}
      slug={slug}
      zonesCount={zones.length}
      backgroundUrl={event.background_url ?? ''}
    />
  );
}
