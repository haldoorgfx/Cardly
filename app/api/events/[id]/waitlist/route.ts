import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name:  z.string().min(1).max(200),
  email: z.string().email(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Name and valid email are required.' }, { status: 400 });
  }
  const { name, email } = parsed.data;

  const admin = createAdminClient();

  // Resolve event page by custom_slug, event slug, or direct event_page id
  const { data: page } = await admin
    .from('event_pages')
    .select('id, title')
    .or(`custom_slug.eq.${params.id},id.eq.${params.id}`)
    .eq('is_public', true)
    .maybeSingle();

  // Fallback: resolve via events.slug
  let pageId = page?.id;
  if (!pageId) {
    const { data: event } = await admin
      .from('events')
      .select('id')
      .eq('slug', params.id)
      .maybeSingle();
    if (event) {
      const { data: ep } = await admin
        .from('event_pages')
        .select('id')
        .eq('event_id', event.id)
        .eq('is_public', true)
        .maybeSingle();
      pageId = ep?.id;
    }
  }

  if (!pageId) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  // Get current waitlist count for position
  const { count } = await admin
    .from('waitlist_entries')
    .select('id', { count: 'exact', head: true })
    .eq('event_page_id', pageId)
    .eq('status', 'waiting');

  const position = (count ?? 0) + 1;

  // Upsert (idempotent — same email re-joins without error)
  const { error } = await admin
    .from('waitlist_entries')
    .upsert(
      { event_page_id: pageId, email: email.toLowerCase(), name, position, status: 'waiting' },
      { onConflict: 'event_page_id,email', ignoreDuplicates: false },
    );

  if (error) {
    return NextResponse.json({ error: 'Could not join waitlist.' }, { status: 500 });
  }

  return NextResponse.json({ position }, { status: 201 });
}
