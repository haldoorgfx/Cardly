import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/events/[id]/people?reg=<registration_id>
// Returns all confirmed registrations for the event (for networking)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const regId = searchParams.get('reg');

  const { data: people, error } = await admin
    .from('registrations')
    .select('id, attendee_name, attendee_email, ticket_type_id, custom_fields, eventera_card_url, ticket_types(name)')
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'checked_in'])
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

  const result = (people ?? [])
    .filter(p => p.id !== regId)
    .map(p => ({
      ...p,
      connection_status: connectionMap.get(p.id) ?? null,
    }));

  return NextResponse.json({ people: result });
}
