import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { hasModeratorAccess } from '@/lib/rbac/ownership';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

const CreateSchema = z.object({
  name: z.string().min(1).max(40),
  description: z.string().max(140).optional().default(''),
});

// Confirm the signed-in user owns this event. Channel management is an
// organizer action, so it's gated on event ownership (not attendee identity).
async function assertOwnsEvent(eventId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: 'Unauthorized' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: event } = await admin
    .from('events').select('id').eq('id', eventId).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return { ok: false as const, status: 403, error: 'Not your event' };
  return { ok: true as const, admin };
}

// GET /api/events/[id]/community/channels?reg=xxx&token=xxx — list channels
// for an event. Mirrors the identity check on GET /api/events/[id]/community
// (messages, in the sibling route) — mobile's channel list used to come
// straight from Supabase, which bypassed both the platform "community" kill
// switch and the same attendee-only gate that route's GET was fixed to
// require.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('community'))) return NextResponse.json({ error: 'Community is currently unavailable.' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const regId = searchParams.get('reg');
  const token = searchParams.get('token');
  let allowed = false;
  if (regId) {
    const identity = await assertOwnsRegistration(params.id, regId, token);
    if (identity.ok) allowed = true;
  }
  if (!allowed) {
    // Organizers / moderators browse the same channel list from the dashboard side.
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    allowed = !!user && (await hasModeratorAccess(user.id, params.id));
  }
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: channels, error } = await admin
    .from('community_channels')
    .select('id, name, description, is_pinned, position')
    .eq('event_id', params.id)
    .order('is_pinned', { ascending: false })
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ channels: channels ?? [] });
}

// POST /api/events/[id]/community/channels — organizer creates a channel
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await assertOwnsEvent(params.id);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const name = parsed.data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!name) return NextResponse.json({ error: 'Invalid channel name' }, { status: 400 });

  const { data: channel, error } = await gate.admin
    .from('community_channels')
    .insert({ event_id: params.id, name, description: parsed.data.description || null })
    .select('id, name, description, is_pinned, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ channel }, { status: 201 });
}

// DELETE /api/events/[id]/community/channels?channel_id=xxx — organizer deletes a channel
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await assertOwnsEvent(params.id);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const channelId = new URL(req.url).searchParams.get('channel_id');
  if (!channelId) return NextResponse.json({ error: 'channel_id required' }, { status: 400 });

  // Scope the delete to this event so a channel from another event can't be removed.
  const { error } = await gate.admin
    .from('community_channels')
    .delete()
    .eq('id', channelId)
    .eq('event_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
