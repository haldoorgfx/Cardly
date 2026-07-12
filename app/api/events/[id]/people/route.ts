import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';

// GET /api/events/[id]/people?reg=<registration_id>
// Returns confirmed registrations for the event (attendee networking directory).
// Requires a valid registration for THIS event — you must be an attendee to see
// the attendee list. Never returns attendee_email to peers.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const regId = searchParams.get('reg');

  const identity = await assertOwnsRegistration(params.id, regId);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();
  const { data: people, error } = await admin
    .from('registrations')
    .select('id, user_id, attendee_name, ticket_type_id, custom_fields, eventera_card_url, ticket_types(name)')
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'checked_in'])
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Privacy: exclude attendees who opted out of the directory (profile.directory_visible = false),
  // except the caller themselves. Registrations without a linked account are shown (they have no
  // profile-level preference). dietary / accessibility are never selected or returned here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peopleRows = (people ?? []) as any[];
  const userIds = Array.from(
    new Set(peopleRows.map(p => p.user_id).filter((u: string | null): u is string => !!u)),
  );
  const hiddenUserIds = new Set<string>();
  if (userIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profs } = await (admin as any)
      .from('profiles')
      .select('id, directory_visible')
      .in('id', userIds);
    for (const pr of profs ?? []) {
      if (pr.directory_visible === false) hiddenUserIds.add(pr.id as string);
    }
  }

  // Get existing connections for the requesting attendee
  let connections: { requester_id: string; recipient_id: string; status: string }[] = [];
  if (regId) {
    const { data } = await admin
      .from('attendee_connections')
      .select('requester_id, recipient_id, status')
      .eq('event_id', params.id)
      .or(`requester_id.eq.${regId},recipient_id.eq.${regId}`);
    connections = (data ?? []) as typeof connections;
  }

  const connectionMap = new Map<string, string>();
  for (const c of connections) {
    const otherId = c.requester_id === regId ? c.recipient_id : c.requester_id;
    connectionMap.set(otherId, c.status);
  }

  const result = peopleRows
    .filter(p => p.id !== regId)
    // Hide directory opt-outs, unless this row is the caller's own registration.
    .filter(p => !(p.user_id && hiddenUserIds.has(p.user_id) && p.id !== regId))
    .map(p => {
      // Never leak the linked account id to other attendees.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_id: _userId, ...rest } = p;
      return {
        ...rest,
        connection_status: connectionMap.get(p.id) ?? null,
      };
    });

  return NextResponse.json({ people: result });
}
