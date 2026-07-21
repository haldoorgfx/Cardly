import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Turn a zod error into a plain-English, field-specific message for the user.
const FIELD_LABELS: Record<string, string> = {
  code: 'Code', discount_value: 'Discount', max_uses: 'Max uses',
  valid_from: 'Valid from', valid_until: 'Valid until', discount_type: 'Discount type',
};
function zodMessage(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return 'Please check the form and try again.';
  const field = issue.path[0];
  const label = typeof field === 'string' ? FIELD_LABELS[field] : null;
  return label ? `${label}: ${issue.message}` : issue.message;
}

// ── Shared validation schema ──────────────────────────────────────────────────

const NullableDateTime = z.preprocess(
  v => (v === '' || v === undefined ? null : v),
  z.string().datetime({ offset: true }).nullable(),
);

// Base object (no refinements) — used as the source for both POST and PATCH schemas
const PromoBaseFields = z.object({
  code:            z.string().min(2, 'Code must be at least 2 characters').max(32, 'Code must be 32 characters or less')
                     .regex(/^[A-Z0-9_-]+$/, 'Code may only contain letters, numbers, hyphens, and underscores')
                     .toUpperCase(),
  discount_type:   z.enum(['percent', 'fixed'] as const),
  discount_value:  z.number().positive('Discount value must be greater than 0'),
  max_uses:        z.number().int().min(1, 'Max uses must be at least 1').nullable().optional(),
  valid_from:      NullableDateTime.optional(),
  valid_until:     NullableDateTime.optional(),
});

function addPromoRefinements<T extends { discount_type?: string; discount_value?: number; valid_from?: string | null; valid_until?: string | null }>(
  schema: z.ZodType<T>,
) {
  return schema.superRefine((data, ctx) => {
    if (data.discount_type === 'percent' && data.discount_value !== undefined && data.discount_value > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Percent discount cannot exceed 100%', path: ['discount_value'] });
    }
    if (data.valid_from && data.valid_until && new Date(data.valid_until) <= new Date(data.valid_from)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expiry date must be after start date', path: ['valid_until'] });
    }
  });
}

// POST: all fields required (code + type + value)
const PromoSchema = addPromoRefinements(PromoBaseFields);

// PATCH: code is immutable, all other fields optional
const PromoPatchSchema = addPromoRefinements(
  PromoBaseFields.omit({ code: true }).partial(),
);

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await admin
    .from('promo_codes')
    .select('*')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promo_codes: data });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = PromoSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: ep } = await admin.from('event_pages').select('starts_at, ends_at').eq('event_id', params.id).maybeSingle();
  if (ep?.ends_at) {
    if (parsed.data.valid_from && new Date(parsed.data.valid_from) >= new Date(ep.ends_at)) {
      return NextResponse.json({ error: `Promo code cannot start on or after the event ends (${fmtDate(ep.ends_at)})` }, { status: 422 });
    }
    if (parsed.data.valid_until && new Date(parsed.data.valid_until) > new Date(ep.ends_at)) {
      return NextResponse.json({ error: `Promo code cannot be valid after the event ends (${fmtDate(ep.ends_at)})` }, { status: 422 });
    }
  }
  if (parsed.data.discount_type === 'fixed') {
    const { data: cheapest } = await admin.from('ticket_types').select('price').eq('event_id', params.id).gt('price', 0).order('price', { ascending: true }).limit(1).maybeSingle();
    if (cheapest && parsed.data.discount_value >= cheapest.price) {
      return NextResponse.json({ error: `Fixed discount (${parsed.data.discount_value}) cannot equal or exceed the cheapest paid ticket price (${cheapest.price})` }, { status: 422 });
    }
  }

  const { data, error } = await admin
    .from('promo_codes')
    .insert({ event_id: params.id, ...parsed.data })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'That promo code already exists for this event' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ promo_code: data }, { status: 201 });
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

  const { codeId, ...rest } = raw as Record<string, unknown>;
  if (!codeId || typeof codeId !== 'string') {
    return NextResponse.json({ error: 'codeId is required' }, { status: 400 });
  }

  const parsed = PromoPatchSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: zodMessage(parsed.error) }, { status: 400 });
  }

  // If updating valid window, re-verify ordering against current DB values
  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: existing } = await admin
    .from('promo_codes')
    .select('valid_from, valid_until, discount_type, discount_value')
    .eq('id', codeId)
    .eq('event_id', params.id)
    .single();

  if (parsed.data.valid_from !== undefined || parsed.data.valid_until !== undefined) {
    const effectiveFrom  = parsed.data.valid_from  ?? existing?.valid_from  ?? null;
    const effectiveUntil = parsed.data.valid_until ?? existing?.valid_until ?? null;
    if (effectiveFrom && effectiveUntil && new Date(effectiveUntil) <= new Date(effectiveFrom)) {
      return NextResponse.json({ error: 'Expiry date must be after start date' }, { status: 400 });
    }
  }

  // Percent cap, checked against the EFFECTIVE type — deliberately outside the
  // date block above. The zod refinement only fires when discount_type is present
  // in the patch, so `PATCH { discount_value: 500 }` against an existing percent
  // code skipped every JS-side check and relied on the DB constraint to reject it.
  {
    const effectivePercentType  = parsed.data.discount_type  ?? existing?.discount_type;
    const effectivePercentValue = parsed.data.discount_value ?? existing?.discount_value;
    if (effectivePercentType === 'percent' && effectivePercentValue !== undefined && Number(effectivePercentValue) > 100) {
      return NextResponse.json({ error: 'Percent discount cannot exceed 100%' }, { status: 400 });
    }
  }

  // Event date bounds (always check when dates or discount changes)
  const { data: ep2 } = await admin.from('event_pages').select('starts_at, ends_at').eq('event_id', params.id).maybeSingle();
  if (ep2?.ends_at) {
    const effectiveFrom  = parsed.data.valid_from  !== undefined ? parsed.data.valid_from  : existing?.valid_from  ?? null;
    const effectiveUntil = parsed.data.valid_until !== undefined ? parsed.data.valid_until : existing?.valid_until ?? null;
    if (effectiveFrom && new Date(effectiveFrom) >= new Date(ep2.ends_at)) {
      return NextResponse.json({ error: `Promo code cannot start on or after the event ends (${fmtDate(ep2.ends_at)})` }, { status: 422 });
    }
    if (effectiveUntil && new Date(effectiveUntil) > new Date(ep2.ends_at)) {
      return NextResponse.json({ error: `Promo code cannot be valid after the event ends (${fmtDate(ep2.ends_at)})` }, { status: 422 });
    }
  }

  // Fixed discount vs cheapest ticket price
  const effectiveType  = parsed.data.discount_type  ?? existing?.discount_type;
  const effectiveValue = parsed.data.discount_value ?? existing?.discount_value ?? 0;
  if (effectiveType === 'fixed') {
    const { data: cheapest } = await admin.from('ticket_types').select('price').eq('event_id', params.id).gt('price', 0).order('price', { ascending: true }).limit(1).maybeSingle();
    if (cheapest && effectiveValue >= cheapest.price) {
      return NextResponse.json({ error: `Fixed discount (${effectiveValue}) cannot equal or exceed the cheapest paid ticket price (${cheapest.price})` }, { status: 422 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  const { data, error } = await (admin as any)
    .from('promo_codes')
    .update(parsed.data)
    .eq('id', codeId)
    .eq('event_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promo_code: data });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const codeId = searchParams.get('codeId');
  if (!codeId) return NextResponse.json({ error: 'codeId required' }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await admin
    .from('promo_codes')
    .delete()
    .eq('id', codeId)
    .eq('event_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
