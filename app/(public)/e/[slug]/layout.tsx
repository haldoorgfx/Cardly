import { createAdminClient } from '@/lib/supabase/server';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { EventShell } from '@/components/events/EventShell';
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

export default async function EventSlugLayout({ children, params }: Props) {
  const resolved = await resolvePublicSlug(params.slug);
  // If the slug doesn't resolve, let the page itself handle notFound().
  if (!resolved) return <>{children}</>;
  const { event } = resolved;

  const admin = createAdminClient();
  // `features` (migration 038) isn't in the generated types yet — cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ep } = await (admin as any)
    .from('event_pages')
    .select('features')
    .eq('event_id', event.id)
    .single();
  const features = ((ep?.features ?? {}) as Record<string, boolean>);

  return (
    <EventShell slug={params.slug} eventName={event.name} features={features}>
      {children}
    </EventShell>
  );
}
