import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .select('*, event_variants(id, variant_name, variant_slug, background_url, background_width, background_height, zones, position, created_at)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = ['name', 'status', 'slug'] as const;
  type UpdateKey = typeof allowed[number];
  const patch: Partial<Record<UpdateKey, unknown>> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  // Normalize slug if provided
  if (typeof patch.slug === 'string') {
    const normalized = patch.slug
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
    if (!normalized) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    patch.slug = normalized;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    // Unique slug collision
    if (error.code === '23505') return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 });
    // No row updated (not found / not owned)
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
