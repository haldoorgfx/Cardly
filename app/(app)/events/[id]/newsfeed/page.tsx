export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewsfeedClient } from '@/components/events/NewsfeedClient';

export async function generateMetadata() {
  return { title: 'Newsfeed' };
}

export default async function NewsfeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  return <NewsfeedClient eventId={id} eventName={event.name} initialPosts={posts ?? []} />;
}
