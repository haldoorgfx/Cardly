import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createAdminClient } from '@/lib/supabase/server';
import type { RegistrationStatus } from '@/types/database';
import { serializeRegistration } from '@/lib/api/serializers';

// GET /api/v1/events/{id}/registrations — paginated attendee list.
// Query: ?status=confirmed&limit=50&offset=0
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateApiKey(req, 'registrations:read');
  if (!auth.ok) return auth.response;

  const db = createAdminClient();

  // Confirm the caller owns this event before exposing its registrations.
  const { data: event } = await db
    .from('events').select('id').eq('id', params.id).eq('user_id', auth.userId).maybeSingle();
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const url = req.nextUrl;
  const status = url.searchParams.get('status');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

  let query = db
    .from('registrations')
    .select('id, event_id, attendee_name, attendee_email, attendee_phone, status, payment_status, ticket_type_id, ticket_types(name), amount_paid, currency, checked_in_at, custom_fields, qr_code_token, created_at', { count: 'exact' })
    .eq('event_id', params.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status as RegistrationStatus);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: (data ?? []).map(serializeRegistration),
    pagination: { limit, offset, total: count ?? (data?.length ?? 0) },
  });
}
