export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PublishClient from './PublishClient';

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

  const isFirstPublish = event.status !== 'published';
  let slug = event.slug;
  if (isFirstPublish) {
    const { data: updated } = await admin
      .from('events')
      .update({ status: 'published' })
      .eq('id', id)
      .select('slug')
      .single();
    if (updated) slug = updated.slug;
  }

  // Ensure event_pages row exists and is public — required for /e/[slug]/register to resolve.
  // Use upsert so repeated Publish clicks are idempotent and existing organiser-configured
  // fields (venue, dates, cover image, etc.) are preserved — we only force is_public = true.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upsertedPage } = await (admin as any)
    .from('event_pages')
    .upsert(
      { event_id: id, title: event.name, is_public: true },
      { onConflict: 'event_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  // On first publish: notify followers who have opted in
  if (isFirstPublish && upsertedPage?.id) {
    const { data: followers } = await admin
      .from('organizer_follows')
      .select('follower_id')
      .eq('organizer_id', user.id)
      .eq('notify_new_events', true);

    if (followers && followers.length > 0) {
      const notifications = followers.map((f: { follower_id: string }) => ({
        user_id: f.follower_id,
        event_id: id,
        type: 'new_event_from_follow' as const,
        title: `New event: ${event.name}`,
        body: `An organizer you follow just published a new event.`,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('notifications').insert(notifications);
    }
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

  // Trim trailing slash so NEXT_PUBLIC_APP_URL=https://karta.cre8so.com/ doesn't produce a double //
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const shareUrl = `${appUrl}/c/${slug}`;

  return (
    <PublishClient
      eventId={id}
      eventName={event.name}
      shareUrl={shareUrl}
      slug={slug}
      zonesCount={zonesCount}
      backgroundUrl={firstVariant?.background_url ?? ''}
      bgW={firstVariant?.background_width ?? 1080}
      bgH={firstVariant?.background_height ?? 1350}
    />
  );
}
