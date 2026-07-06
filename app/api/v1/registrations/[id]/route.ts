import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { serializeRegistration } from '@/lib/api/serializers';

// GET /api/v1/registrations/{id} — a single registration the caller owns.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authenticateApiKey(req, 'registrations:read');
  if (!auth.ok) return auth.response;

  const db = createAdminClient();
  const { data: r } = await db
    .from('registrations')
    .select('id, event_id, attendee_name, attendee_email, attendee_phone, status, payment_status, ticket_type_id, ticket_types(name), amount_paid, currency, checked_in_at, custom_fields, qr_code_token, created_at, events!inner(user_id)')
    .eq('id', params.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!r || (r as any).events?.user_id !== auth.userId) {
    return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
  }

  return NextResponse.json(serializeRegistration(r));
}
