import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ── Validation helpers ────────────────────────────────────────────────────────

/** ISO-8601 datetime OR empty/null — coerced to null when falsy */
const NullableDateTime = z.preprocess(
  v => (v === '' || v === undefined ? null : v),
  z.string().datetime({ offset: true }).nullable(),
);

const TicketBodySchema = z.object({
  name:           z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim(),
  description:    z.string().max(500).trim().optional().default(''),
  price:          z.number()
                    .min(0, 'Price cannot be negative')
                    .max(9_999_999, 'Price exceeds maximum allowed'),
  currency:       z.string().regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code').default('USD'),
  quantity:       z.number().int().min(1, 'Quantity must be at least 1').max(1_000_000, 'Quantity is too large').nullable().optional(),
  sales_start:    NullableDateTime.optional(),
  sales_end:      NullableDateTime.optional(),
  is_visible:     z.boolean().default(true),
  min_per_order:  z.number().int().min(1).max(100).optional(),
  max_per_order:  z.number().int().min(1).max(100).optional(),
  position:       z.number().int().min(0).optional(),
}).refine(data => {
  // sales_end must be after sales_start when both are provided
  if (data.sales_start && data.sales_end) {
    return new Date(data.sales_end) > new Date(data.sales_start);
  }
  return true;
}, { message: 'Sales end must be after sales start', path: ['sales_end'] })
.refine(data => {
  // min_per_order must be <= max_per_order when both are provided
  if (data.min_per_order != null && data.max_per_order != null) {
    return data.min_per_order <= data.max_per_order;
  }
  return true;
}, { message: 'Min per order cannot exceed max per order', path: ['max_per_order'] });

// Only these columns may be written — never event_id, quantity_sold, stripe_*
const ALLOWED_PATCH_KEYS = new Set([
  'name', 'description', 'price', 'currency', 'quantity',
  'sales_start', 'sales_end', 'is_visible',
  'min_per_order', 'max_per_order', 'position',
]);

// ── GET ───────────────────────────────────────────────────────────────────────

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

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = TicketBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await admin
    .from('ticket_types')
    .insert({ ...parsed.data, event_id: params.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data }, { status: 201 });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { ticketId, ...rest } = raw as Record<string, unknown>;
  if (!ticketId || typeof ticketId !== 'string') {
    return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
  }

  // Strip any disallowed keys (prevents overwriting event_id, quantity_sold, etc.)
  const safeUpdates = Object.fromEntries(
    Object.entries(rest).filter(([k]) => ALLOWED_PATCH_KEYS.has(k)),
  );

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Validate the allowed subset
  const parsed = TicketBodySchema.partial().safeParse(safeUpdates);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // If updating sales window, re-verify ordering against what will be in the DB
  if (parsed.data.sales_start !== undefined || parsed.data.sales_end !== undefined) {
    const { data: existing } = await admin
      .from('ticket_types')
      .select('sales_start, sales_end')
      .eq('id', ticketId)
      .eq('event_id', params.id)
      .single();

    const effectiveStart = parsed.data.sales_start ?? existing?.sales_start ?? null;
    const effectiveEnd   = parsed.data.sales_end   ?? existing?.sales_end   ?? null;
    if (effectiveStart && effectiveEnd && new Date(effectiveEnd) <= new Date(effectiveStart)) {
      return NextResponse.json({ error: 'Sales end must be after sales start' }, { status: 400 });
    }
  }

  const { data, error } = await admin
    .from('ticket_types')
    .update(parsed.data)
    .eq('id', ticketId)
    .eq('event_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticketId');
  if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify ticket belongs to this event
  const { data: ticket } = await admin
    .from('ticket_types')
    .select('id')
    .eq('id', ticketId)
    .eq('event_id', params.id)
    .single();

  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  // Check actual registration count (quantity_sold may be stale from manual/bulk imports)
  const { count: regCount } = await admin
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('ticket_type_id', ticketId)
    .in('status', ['confirmed', 'checked_in', 'pending']);

  if ((regCount ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete a ticket type that has registrations. Set it as hidden instead.' },
      { status: 409 },
    );
  }

  // Nullify any remaining references (cancelled/refunded registrations) to satisfy FK constraint
  await admin
    .from('registrations')
    .update({ ticket_type_id: null })
    .eq('ticket_type_id', ticketId);

  const { error } = await admin
    .from('ticket_types')
    .delete()
    .eq('id', ticketId)
    .eq('event_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
