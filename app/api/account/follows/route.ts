import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('organizer_follows')
    .select(`id, organizer_id, notify_new_events, created_at,
      profiles!organizer_follows_organizer_id_fkey(id, full_name, avatar_url, email)`)
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with follower counts and next upcoming event per organizer
  const enriched = await Promise.all((data ?? []).map(async (row) => {
    const orgId = row.organizer_id;

    const [{ count: followerCount }, { data: nextEvents }] = await Promise.all([
      supabase.from('organizer_follows').select('id', { count: 'exact', head: true }).eq('organizer_id', orgId),
      supabase.from('event_pages')
        .select('title, starts_at, events!inner(user_id, status)')
        .eq('events.user_id', orgId)
        .eq('events.status', 'published')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(1),
    ]);

    return {
      ...row,
      follower_count: followerCount ?? 0,
      next_event: nextEvents?.[0] ?? null,
    };
  }));

  return NextResponse.json({ follows: enriched });
}

const addSchema = z.object({ organizer_id: z.string().uuid() });

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  if (parsed.data.organizer_id === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  const { error } = await supabase
    .from('organizer_follows')
    .upsert({ follower_id: user.id, organizer_id: parsed.data.organizer_id }, { onConflict: 'follower_id,organizer_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get('organizer_id');
  if (!organizerId) return NextResponse.json({ error: 'Missing organizer_id' }, { status: 400 });

  const { error } = await supabase
    .from('organizer_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('organizer_id', organizerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
