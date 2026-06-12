import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';

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

  // Capacity check before import
  const { data: ep } = await admin.from('event_pages').select('max_capacity').eq('event_id', params.id).maybeSingle();
  if (ep?.max_capacity) {
    const { count: confirmed } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', params.id).in('status', ['confirmed', 'checked_in']);
    const remaining = ep.max_capacity - (confirmed ?? 0);
    if (remaining <= 0) {
      return NextResponse.json({ error: 'This event is at full capacity — import cannot proceed' }, { status: 409 });
    }
    if (attendees.length > remaining) {
      return NextResponse.json({ error: `Import exceeds capacity. Only ${remaining} spot${remaining === 1 ? '' : 's'} remain${remaining === 1 ? 's' : ''} but you are importing ${attendees.length} attendees.` }, { status: 409 });
    }
  }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toInsert: any[] = [];
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
    const { error } = await admin.from('registrations').upsert(toInsert, { onConflict: 'event_id,attendee_email', ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    imported = toInsert.length;

    // Keep quantity_sold in sync on the ticket type
    if (ticket) {
      const { data: cur } = await admin
        .from('ticket_types')
        .select('quantity_sold')
        .eq('id', ticket.id)
        .single();
      await admin
        .from('ticket_types')
        .update({ quantity_sold: (cur?.quantity_sold ?? 0) + imported })
        .eq('id', ticket.id);
    }
  }

  if (imported > 0) {
    // Fetch event name for the notification title
    const { data: ev } = await admin.from('events').select('name').eq('id', params.id).single();
    createNotification({
      userId: user.id,
      eventId: params.id,
      type: 'registration',
      title: `${imported} attendee${imported !== 1 ? 's' : ''} imported for ${ev?.name ?? 'your event'}`,
      body: skipped.length > 0 ? `${skipped.length} duplicate${skipped.length !== 1 ? 's' : ''} skipped` : undefined,
      actionUrl: `/events/${params.id}/registrations`,
      icon: 'users',
    });
  }

  return NextResponse.json({ imported, skipped: skipped.length, invalid: invalid.length, skipped_emails: skipped });
}
