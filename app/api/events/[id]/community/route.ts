import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { z } from 'zod';

const PostSchema = z.object({
  channel_id: z.string().uuid(),
  registration_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

// GET /api/events/[id]/community?channel_id=xxx — messages for a channel
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get('channel_id');
  if (!channelId) return NextResponse.json({ error: 'channel_id required' }, { status: 400 });

  const admin = createAdminClient();

  // Confirm the channel belongs to this event.
  const { data: channel } = await admin
    .from('community_channels')
    .select('id, event_id')
    .eq('id', channelId)
    .eq('event_id', params.id)
    .single();
  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

  const { data: messages, error } = await admin
    .from('community_messages')
    .select('id, content, created_at, is_pinned, registration_id, registrations(attendee_name)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: messages ?? [] });
}

// POST /api/events/[id]/community — post a message into a channel
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { channel_id, registration_id, content } = parsed.data;

  // The sender must own the supplied registration for this event.
  const identity = await assertOwnsRegistration(params.id, registration_id);
  if (!identity.ok) return NextResponse.json({ error: identity.error }, { status: identity.status });

  const admin = createAdminClient();

  // Channel must belong to this event (prevents cross-event posting).
  const { data: channel } = await admin
    .from('community_channels')
    .select('id, event_id')
    .eq('id', channel_id)
    .eq('event_id', params.id)
    .single();
  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

  const { data: message, error } = await admin
    .from('community_messages')
    .insert({ channel_id, registration_id, content })
    .select('id, content, created_at, is_pinned, registration_id, registrations(attendee_name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message }, { status: 201 });
}
