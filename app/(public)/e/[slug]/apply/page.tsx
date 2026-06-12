export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ApprovalFlowClient } from '@/components/registration/ApprovalFlowClient';

interface Props { params: Promise<{ slug: string }> }

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  // Try custom_slug first, then event slug
  let { data: ep } = await db
    .from('event_pages')
    .select('id, title, cover_image_url, starts_at, city, is_online, events(id, name, slug, status)')
    .eq('custom_slug', slug)
    .maybeSingle();

  if (!ep) {
    const res = await db
      .from('event_pages')
      .select('id, title, cover_image_url, starts_at, city, is_online, events!inner(id, name, slug, status)')
      .eq('events.slug', slug)
      .maybeSingle();
    ep = res.data;
  }

  if (!ep || ep.events?.status !== 'published') notFound();

  // Fetch application questions if any
  const { data: questions } = await db
    .from('application_questions')
    .select('id, label, type, required, options')
    .eq('event_id', ep.events.id)
    .order('position');

  return (
    <ApprovalFlowClient
      eventId={ep.events.id}
      eventName={ep.title ?? ep.events.name}
      eventSlug={slug}
      coverImage={ep.cover_image_url}
      questions={questions ?? []}
    />
  );
}
