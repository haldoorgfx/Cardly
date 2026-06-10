export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import WaitlistJoinClient from '@/components/registration/WaitlistJoinClient';

interface Props { params: { slug: string } }

export default async function WaitlistPage({ params }: Props) {
  const admin = createAdminClient();

  // Support both custom_slug and event slug
  const { data: page } = await admin
    .from('event_pages')
    .select('id, title, cover_image_url, starts_at, city, is_online, custom_slug, events!inner(slug, name)')
    .or(`custom_slug.eq.${params.slug},events.slug.eq.${params.slug}`)
    .eq('is_public', true)
    .single();

  if (!page) notFound();

  // Count current waitlist
  const { count } = await admin
    .from('waitlist_entries')
    .select('id', { count: 'exact', head: true })
    .eq('event_page_id', page.id)
    .eq('status', 'waiting');

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
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
