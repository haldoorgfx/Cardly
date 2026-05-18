import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function verifyOwner(eventId: string, userId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', userId).single();
  return !!data;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  if (!(await verifyOwner(id, user.id, admin))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const allowed = ['variant_name', 'zones', 'background_url', 'background_width', 'background_height'] as const;
  type UpdateKey = typeof allowed[number];
  const patch: Partial<Record<UpdateKey, unknown>> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const { data, error } = await admin
    .from('event_variants')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', variantId)
    .eq('event_id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  if (!(await verifyOwner(id, user.id, admin))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Don't allow deleting the last variant
  const { count } = await admin
    .from('event_variants')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id);

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last variant' }, { status: 400 });
  }

  const { error } = await admin
    .from('event_variants')
    .delete()
    .eq('id', variantId)
    .eq('event_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
