export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import WaitlistJoinClient from '@/components/registration/WaitlistJoinClient';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Props { params: { slug: string } }

export default async function WaitlistPage({ params }: Props) {
  if (!(await isPlatformFeatureEnabled('waitlist'))) notFound();

  const admin = createAdminClient();

  // Two-step slug resolution — .or() with cross-table filter is broken in PostgREST
  let page: { id: string; title: string; cover_image_url: string | null; starts_at: string | null; city: string | null; is_online: boolean } | null = null;

  // 1. Try custom_slug first
  const { data: byCustom } = await admin
    .from('event_pages')
    .select('id, title, cover_image_url, starts_at, city, is_online')
    .eq('custom_slug', params.slug)
    .eq('is_public', true)
    .maybeSingle();

  if (byCustom) {
    page = byCustom;
  } else {
    // 2. Find event by slug → get event_page
    const { data: event } = await admin.from('events').select('id').eq('slug', params.slug).maybeSingle();
    if (event) {
      const { data: byEvent } = await admin
        .from('event_pages')
        .select('id, title, cover_image_url, starts_at, city, is_online')
        .eq('event_id', event.id)
        .eq('is_public', true)
        .maybeSingle();
      page = byEvent;
    }
  }

  if (!page) notFound();

  // Count current waitlist
  const { count } = await admin
    .from('waitlist_entries')
    .select('id', { count: 'exact', head: true })
    .eq('event_page_id', page.id)
    .eq('status', 'waiting');

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <WaitlistJoinClient
        slug={params.slug}
        pageId={page.id}
        title={page.title}
        coverUrl={page.cover_image_url}
        startsAt={page.starts_at}
        city={page.is_online ? 'Online' : (page.city ?? null)}
        currentCount={count ?? 0}
      />
    </div>
  );
}
