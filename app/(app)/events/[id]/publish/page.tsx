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
    .select('id, name, slug, status')
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

  // Get total zones from all variants
  const { data: variants } = await admin
    .from('event_variants')
    .select('zones, background_url, background_width, background_height')
    .eq('event_id', id)
    .order('position', { ascending: true });

  const firstVariant = variants?.[0];
  const zonesCount = variants?.reduce((sum, v) => {
    return sum + (Array.isArray(v.zones) ? (v.zones as unknown[]).length : 0);
  }, 0) ?? 0;

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/c/${slug}`;

  return (
    <PublishClient
      eventId={id}
      eventName={event.name}
      shareUrl={shareUrl}
      slug={slug}
      zonesCount={zonesCount}
      backgroundUrl={firstVariant?.background_url ?? ''}
      zones={(firstVariant?.zones as unknown as Zone[]) ?? []}
      bgW={firstVariant?.background_width ?? 1080}
      bgH={firstVariant?.background_height ?? 1350}
    />
  );
}
