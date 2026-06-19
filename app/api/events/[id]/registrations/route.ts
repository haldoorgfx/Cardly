import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const status = searchParams.get('status');

  const q = searchParams.get('q')?.trim()?.replace(/[(),*:%]/g, '');

  let query = admin
    .from('registrations')
    .select('*, ticket_types(name, price)', { count: 'exact' })
    .eq('event_id', params.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status as 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'refunded');
  if (q) query = query.or(`attendee_name.ilike.%${q}%,attendee_email.ilike.%${q}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ registrations: data, total: count });
}

// Manual walk-in registration by organizer — bypasses event_page public check and ticket sales dates
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as {
    attendee_name: string;
    attendee_email: string;
    attendee_phone?: string;
    ticket_type_id?: string;
    notes?: string;
  };

  const { attendee_name, attendee_email, ticket_type_id, attendee_phone, notes } = body;
  if (!attendee_name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!attendee_email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  // Capacity check
  const { data: epManual } = await admin.from('event_pages').select('max_capacity').eq('event_id', params.id).maybeSingle();
  if (epManual?.max_capacity) {
    const { count: confirmed } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', params.id).in('status', ['confirmed', 'checked_in']);
    if ((confirmed ?? 0) >= epManual.max_capacity) {
      return NextResponse.json({ error: 'This event is at full capacity — manual registration cannot be added' }, { status: 409 });
    }
  }

  // Verify ticket belongs to this event (if provided)
  let ticket: { id: string; name: string; price: number; currency: string } | null = null;
  if (ticket_type_id) {
    const { data } = await admin
      .from('ticket_types')
      .select('id, name, price, currency')
      .eq('id', ticket_type_id)
      .eq('event_id', params.id)
      .single();
    if (!data) return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 });
    ticket = data;
  }

  const token = crypto.randomUUID().replace(/-/g, '');

  const { data: reg, error } = await admin
    .from('registrations')
    .insert({
      event_id: params.id,
      ticket_type_id: ticket_type_id ?? null,
      attendee_name: attendee_name.trim(),
      attendee_email: attendee_email.trim().toLowerCase(),
      attendee_phone: attendee_phone?.trim() ?? null,
      status: 'confirmed',
      payment_status: ticket ? (ticket.price === 0 ? 'free' : 'paid') : 'free',
      amount_paid: ticket?.price ?? 0,
      currency: ticket?.currency ?? 'USD',
      qr_code_token: token,
      source: 'manual',
      custom_fields: notes ? { notes } : {},
    })
    .select('id, attendee_name, attendee_email, attendee_phone, status, payment_status, amount_paid, currency, eventera_card_url, checked_in_at, created_at, ticket_types(name, price)')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'This email is already registered for this event' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget notification to the organizer
  createNotification({
    userId: user.id,
    eventId: params.id,
    type: 'registration',
    title: `${attendee_name.trim()} registered for ${event.name}`,
    body: attendee_email.trim().toLowerCase(),
    actionUrl: `/events/${params.id}/registrations`,
    icon: 'users',
  });

  return NextResponse.json({ registration: reg }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  // Verify event ownership
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  const { registrationId, eventera_card_url, eventera_card_zone_data, status, attendee_name, attendee_email, attendee_phone, ticket_type_id } = body;
  if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (eventera_card_url !== undefined) patch.eventera_card_url = eventera_card_url;
  if (eventera_card_zone_data !== undefined) patch.eventera_card_zone_data = eventera_card_zone_data;
  if (status !== undefined) {
    const VALID_STATUSES = ['pending', 'confirmed', 'checked_in', 'cancelled', 'refunded'];
    if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    // Capacity check when manually promoting to confirmed or checked_in
    if (status === 'confirmed' || status === 'checked_in') {
      const { data: epPatch } = await admin.from('event_pages').select('max_capacity').eq('event_id', params.id).maybeSingle();
      if (epPatch?.max_capacity) {
        const { count: confirmedCount } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', params.id).in('status', ['confirmed', 'checked_in']).neq('id', registrationId);
        if ((confirmedCount ?? 0) >= epPatch.max_capacity) {
          return NextResponse.json({ error: 'Cannot confirm — the event is at full capacity' }, { status: 409 });
        }
      }
    }

    patch.status = status;
    if (status === 'checked_in') patch.checked_in_at = new Date().toISOString();
    else patch.checked_in_at = null;
  }
  if (attendee_name !== undefined) patch.attendee_name = attendee_name;
  if (attendee_email !== undefined) patch.attendee_email = attendee_email.toLowerCase();
  if (attendee_phone !== undefined) patch.attendee_phone = attendee_phone || null;
  if (ticket_type_id !== undefined) patch.ticket_type_id = ticket_type_id || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('registrations')
    .update(patch)
    .eq('id', registrationId)
    .eq('event_id', params.id)
    .select('*, ticket_types(name, price)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ registration: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const regId = searchParams.get('regId');
  if (!regId) return NextResponse.json({ error: 'regId required' }, { status: 400 });

  const { error } = await admin.from('registrations').delete().eq('id', regId).eq('event_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
