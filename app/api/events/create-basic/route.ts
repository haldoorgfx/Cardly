import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { canCreateEvent } from '@/lib/billing/can';
import { generateSlug } from '@/lib/slug';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await canCreateEvent(user.id);
  if (!allowed) return NextResponse.json({ error: 'PLAN_LIMIT' }, { status: 402 });

  const body = await req.json().catch(() => ({}));
  const rawName = (body.name as string | undefined)?.trim() || 'Untitled Event';
  const name = rawName.slice(0, 200);

  const venueName    = (body.venue_name    as string | undefined) ?? null;
  const venueAddress = (body.venue_address as string | undefined) ?? null;
  const venueLat     = typeof body.venue_lat === 'number' ? body.venue_lat : null;
  const venueLng     = typeof body.venue_lng === 'number' ? body.venue_lng : null;
  const city         = (body.city          as string | undefined) ?? null;
  const country      = (body.country       as string | undefined) ?? null;
  const isOnline     = body.is_online === true;

  const admin = createAdminClient();

  // Ensure a profile row exists — guards against signup trigger failures.
  // This is a no-op for users who already have a row (ignoreDuplicates: true).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('profiles').upsert(
    { id: user.id, email: user.email ?? '', full_name: (user.user_metadata?.full_name as string) || '' },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  // Retry up to 3 times on slug collision
  let event: { id: string; slug: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateSlug(name);

    const { data, error: dbError } = await admin
      .from('events')
      .insert({
        user_id: user.id,
        name,
        slug,
        // zones omitted — DB default is '[]'::jsonb; avoids schema cache issues
        status: 'draft' as const,
      })
      .select('id, slug')
      .single();

    if (!dbError) { event = data; break; }
    if (dbError.code !== '23505') return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!event) return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 500 });

  // Create a draft event_pages row immediately so the event page editor
  // has something to work with and /e/[slug]/register resolves after publish.
  // is_public = false — stays private until the organiser clicks Publish.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('event_pages').insert({
    event_id:      event.id,
    title:         name,
    is_public:     false,
    is_online:     isOnline,
    venue_name:    venueName,
    venue_address: venueAddress,
    venue_lat:     venueLat,
    venue_lng:     venueLng,
    city,
    country,
    starts_at:     body.starts_at ?? null,
    ends_at:       body.ends_at   ?? null,
  });

  return NextResponse.json({ id: event.id, slug: event.slug }, { status: 201 });
}
