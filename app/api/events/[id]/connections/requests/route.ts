import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';

// GET /api/events/[id]/connections/requests?reg=<registration_id>
// Returns the caller's pending connection requests, split into:
//   incoming — requests sent TO the caller (actionable: accept / decline)
//   sent     — requests the caller has sent (read-only status)
// Each row carries the connection_id so the client can PATCH accept/decline.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const regId = searchParams.get('reg');
  if (!regId) return NextResponse.json({ error: 'Missing registration' }, { status: 400 });

  // Identity: only the owner of the registration may read its requests (guests allowed).
  const identity = await assertOwnsRegistration(params.id, regId);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();

  const { data: conns, error } = await admin
    .from('attendee_connections')
    .select('id, requester_id, recipient_id, status, created_at')
    .eq('event_id', params.id)
    .eq('status', 'pending')
    .or(`requester_id.eq.${regId},recipient_id.eq.${regId}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = conns ?? [];

  // Resolve names for every other party in one query.
  const otherIds = Array.from(
    new Set(rows.map(c => (c.requester_id === regId ? c.recipient_id : c.requester_id))),
  );

  const nameMap = new Map<string, string>();
  if (otherIds.length) {
    const { data: regs } = await admin
      .from('registrations')
      .select('id, attendee_name')
      .in('id', otherIds);
    for (const r of regs ?? []) nameMap.set(r.id, r.attendee_name);
  }

  const incoming = rows
    .filter(c => c.recipient_id === regId)
    .map(c => ({
      connection_id: c.id,
      person_id: c.requester_id,
      name: nameMap.get(c.requester_id) ?? 'Attendee',
      created_at: c.created_at,
    }));

  const sent = rows
    .filter(c => c.requester_id === regId)
    .map(c => ({
      connection_id: c.id,
      person_id: c.recipient_id,
      name: nameMap.get(c.recipient_id) ?? 'Attendee',
      created_at: c.created_at,
    }));

  return NextResponse.json({ incoming, sent });
}
