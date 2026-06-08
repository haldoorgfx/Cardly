import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface AttendeeRow {
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  ticket_type_id?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { attendees: AttendeeRow[]; ticket_type_id?: string };
  const { attendees, ticket_type_id } = body;

  if (!Array.isArray(attendees) || attendees.length === 0)
    return NextResponse.json({ error: 'No attendees provided' }, { status: 400 });
  if (attendees.length > 1000)
    return NextResponse.json({ error: 'Maximum 1000 attendees per import' }, { status: 400 });

  // Verify ticket type if provided
  let ticket: { id: string; price: number; currency: string } | null = null;
  if (ticket_type_id) {
    const { data } = await admin
      .from('ticket_types')
      .select('id, price, currency')
      .eq('id', ticket_type_id)
      .eq('event_id', params.id)
      .single();
    if (!data) return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 });
    ticket = data;
  }

  // Fetch existing emails to detect duplicates
  const { data: existing } = await admin
    .from('registrations')
    .select('attendee_email')
    .eq('event_id', params.id);
  const existingEmails = new Set((existing ?? []).map(r => r.attendee_email.toLowerCase()));

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const toInsert: object[] = [];
  const skipped: string[] = [];
  const invalid: string[] = [];

  for (const row of attendees) {
    const name  = row.attendee_name?.trim();
    const email = row.attendee_email?.trim().toLowerCase();
    if (!name || !email) { invalid.push(email || name || '(empty row)'); continue; }
    if (!EMAIL_RE.test(email)) { invalid.push(email); continue; }
    if (existingEmails.has(email)) { skipped.push(email); continue; }
    existingEmails.add(email); // prevent intra-batch duplication
    toInsert.push({
      event_id:       params.id,
      ticket_type_id: ticket?.id ?? row.ticket_type_id ?? null,
      attendee_name:  name,
      attendee_email: email,
      attendee_phone: row.attendee_phone?.trim() || null,
      status:         'confirmed',
      payment_status: ticket ? (ticket.price === 0 ? 'free' : 'paid') : 'free',
      amount_paid:    ticket?.price ?? 0,
      currency:       ticket?.currency ?? 'USD',
      qr_code_token:  crypto.randomUUID().replace(/-/g, ''),
      source:         'import',
    });
  }

  let imported = 0;
  if (toInsert.length > 0) {
    const { error } = await admin.from('registrations').insert(toInsert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    imported = toInsert.length;
  }

  return NextResponse.json({ imported, skipped: skipped.length, invalid: invalid.length, skipped_emails: skipped });
}
