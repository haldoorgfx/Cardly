export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewsfeedClient } from '@/components/events/NewsfeedClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

export async function generateMetadata() {
  return { title: 'Newsfeed' };
}

export default async function NewsfeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const [{ data: event }, { data: posts }] = await Promise.all([
    db.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    db.from('event_posts').select('id, body, image_url, scheduled_at, published_at, is_pinned, created_at')
      .eq('event_id', id).order('created_at', { ascending: false }).limit(50),
  ]);

  if (!event) redirect('/dashboard');

  return <NewsfeedClient eventId={id} eventName={event.name} initialPosts={posts ?? []} />;
}
