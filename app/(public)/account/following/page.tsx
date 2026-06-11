export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import SavedAndFollowing from '@/components/account/SavedAndFollowing';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Saved & following' };

export default async function AccountFollowingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/account/following');

  const [{ data: rawSaves }, { data: rawFollows }] = await Promise.all([
    supabase
      .from('saved_events')
      .select(`id, event_page_id, created_at,
        event_pages(id, title, cover_image_url, starts_at, venue_name, venue_address,
          events!inner(id, name, slug, user_id))`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('organizer_follows')
      .select(`id, organizer_id, notify_new_events, created_at,
        profiles!organizer_follows_organizer_id_fkey(id, full_name, avatar_url, email)`)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  // Enrich follows with counts + next event
  const follows = await Promise.all((rawFollows ?? []).map(async (row) => {
    const orgId = row.organizer_id;
    const [{ count }, { data: nextEvents }] = await Promise.all([
      supabase.from('organizer_follows').select('id', { count: 'exact', head: true }).eq('organizer_id', orgId),
      supabase.from('event_pages')
        .select('title, starts_at, events!inner(user_id, status)')
        .eq('events.user_id', orgId)
        .eq('events.status', 'published')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(1),
    ]);
    return { ...row, follower_count: count ?? 0, next_event: nextEvents?.[0] ?? null };
  }));

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[1120px] mx-auto px-5 pb-24" style={{ paddingTop: 44 }}>
        <h1 className="font-normal text-[32px]" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.025em', color: '#1F4D3A' }}>
          Saved &amp; following
        </h1>
        <SavedAndFollowing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialSaves={(rawSaves ?? []) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialFollows={follows as any}
        />
      </div>
    </div>
  );
}
