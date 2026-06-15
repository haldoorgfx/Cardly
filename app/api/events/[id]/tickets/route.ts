import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface EventConstraints {
  starts_at: string;
  ends_at: string;
  max_capacity: number | null;
}

interface ExistingTicket {
  id: string;
  quantity: number | null;
}

function validateTicketBody(
  body: Record<string, unknown>,
  ep: EventConstraints | null,
  existingTickets: ExistingTicket[],
  skipId?: string,
  // Only enforce the capacity cap when the quantity is actually being set/changed.
  // Otherwise unrelated edits (e.g. toggling visibility) on an already over-allocated
  // ticket would be wrongly rejected.
  checkCapacity = true,
): string | null {
  const name = body.name != null ? String(body.name).trim() : null;
  const price = body.price != null ? Number(body.price) : null;
  const qty = body.quantity != null ? Number(body.quantity) : null;
  const min = body.min_per_order != null ? Number(body.min_per_order) : null;
  const max = body.max_per_order != null ? Number(body.max_per_order) : null;
  const salesStart = body.sales_start ? String(body.sales_start) : null;
  const salesEnd = body.sales_end ? String(body.sales_end) : null;

  if (name !== null && !name) return 'Ticket name is required';
  if (price !== null && price < 0) return 'Price cannot be negative';
  if (qty !== null && qty < 1) return 'Quantity must be at least 1';
  if (min !== null && min < 1) return 'Min per order must be at least 1';
  if (max !== null && max < 1) return 'Max per order must be at least 1';
  if (min !== null && max !== null && min > max) {
    return `Min per order (${min}) cannot be greater than max per order (${max})`;
  }
  if (salesStart && salesEnd && new Date(salesStart) >= new Date(salesEnd)) {
    return 'Sales start must be before sales end';
  }

  if (ep) {
    if (salesEnd && new Date(salesEnd) > new Date(ep.ends_at)) {
      return `Sales cannot end after the event ends (${fmtDate(ep.ends_at)})`;
    }
    if (salesStart && new Date(salesStart) >= new Date(ep.ends_at)) {
      return `Sales cannot start on or after the event end (${fmtDate(ep.ends_at)})`;
    }
    if (checkCapacity && ep.max_capacity !== null && qty !== null) {
      const others = existingTickets
        .filter(t => t.id !== skipId)
        .reduce((sum, t) => sum + (t.quantity ?? 0), 0);
      const available = ep.max_capacity - others;
      if (qty > available) {
        return available <= 0
          ? `Event capacity (${ep.max_capacity}) is already fully allocated across other ticket types`
          : `Quantity (${qty}) exceeds available capacity. You can allocate at most ${available} more tickets (event max: ${ep.max_capacity}, already allocated: ${others})`;
      }
    }
  }

  return null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ticket_types')
    .select('*')
    .eq('event_id', params.id)
    .order('position');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: event }, { data: ep }, { data: existing }] = await Promise.all([
    admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('event_pages').select('starts_at, ends_at, max_capacity').eq('event_id', params.id).maybeSingle(),
    admin.from('ticket_types').select('id, quantity').eq('event_id', params.id).not('quantity', 'is', null),
  ]);

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const err = validateTicketBody(body, ep ?? null, existing ?? []);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const { data, error: dbError } = await admin
    .from('ticket_types')
    .insert({ ...body, event_id: params.id })
    .select()
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ticket: data }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ticketId, ...updates } = await req.json();
  if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });

  const admin = createAdminClient();
  const [{ data: event }, { data: ep }, { data: existing }, { data: current }] = await Promise.all([
    admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('event_pages').select('starts_at, ends_at, max_capacity').eq('event_id', params.id).maybeSingle(),
    admin.from('ticket_types').select('id, quantity').eq('event_id', params.id).not('quantity', 'is', null),
    admin.from('ticket_types').select('*').eq('id', ticketId).single(),
  ]);

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Merge current values with updates for full-context validation
  const merged: Record<string, unknown> = current ? { ...current, ...updates } : updates;
  const err = validateTicketBody(merged, ep ?? null, existing ?? [], ticketId, 'quantity' in updates);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  const { data, error: dbError } = await admin
    .from('ticket_types')
    .update(updates)
    .eq('id', ticketId)
    .eq('event_id', params.id)
    .select()
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticketId');
  if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await admin
    .from('ticket_types').delete().eq('id', ticketId).eq('event_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
