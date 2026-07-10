export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewsfeedClient } from '@/components/events/NewsfeedClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

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
    db.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    db.from('event_posts').select('id, body, image_url, scheduled_at, published_at, is_pinned, created_at')
      .eq('event_id', id).order('created_at', { ascending: false }).limit(50),
  ]);

  if (!event) redirect('/dashboard');

  // Server action: delete a scheduled post. Re-derives the caller and verifies
  // they own the post's event before deleting — never trusts the client.
  async function deletePost(postId: string): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    const supa = createClient();
    const { data: { user: caller } } = await supa.auth.getUser();
    if (!caller) return { error: 'Not authorized' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data: post } = await admin
      .from('event_posts')
      .select('id, event_id')
      .eq('id', postId)
      .maybeSingle();
    if (!post) return { error: 'Post not found' };

    const { data: owned } = await admin
      .from('events')
      .select('id')
      .eq('id', post.event_id)
      .eq('user_id', caller.id)
      .maybeSingle();
    if (!owned) return { error: 'Not authorized' };

    const { error } = await admin.from('event_posts').delete().eq('id', postId);
    if (error) return { error: error.message };
    return { ok: true };
  }

  return (
    <NewsfeedClient
      eventId={id}
      eventName={event.name}
      initialPosts={posts ?? []}
      deletePost={deletePost}
    />
  );
}
