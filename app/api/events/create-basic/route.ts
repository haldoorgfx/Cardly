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
  const name: string = (body.name as string | undefined)?.trim() || 'Untitled Event';

  const admin = createAdminClient();

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
        zones: [],
        status: 'draft' as const,
      })
      .select('id, slug')
      .single();

    if (!dbError) { event = data; break; }
    if (dbError.code !== '23505') return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!event) return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 500 });

  return NextResponse.json({ id: event.id, slug: event.slug }, { status: 201 });
}
