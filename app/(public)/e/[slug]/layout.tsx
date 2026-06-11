import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

interface Props {
  children: React.ReactNode;
  params: { slug: string };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const admin = createAdminClient();

  // Try custom_slug first, then events.slug
  const { data: byCustomSlug } = await admin
    .from('event_pages')
    .select('title')
    .eq('custom_slug', params.slug)
    .single();
  if (byCustomSlug) return { title: byCustomSlug.title };

  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('slug', params.slug)
    .single();
  if (!event) return { title: 'Event' };

  const { data: page } = await admin
    .from('event_pages')
    .select('title')
    .eq('event_id', event.id)
    .single();

  return { title: page?.title ?? event.name };
}

export default function EventSlugLayout({ children }: Props) {
  return <>{children}</>;
}
