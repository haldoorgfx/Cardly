import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Validation ────────────────────────────────────────────────────────────────

const NullableDateTime = z.preprocess(
  v => (v === '' || v === undefined ? null : v),
  z.string().datetime({ offset: true }).nullable(),
);

/** Only columns that a client is allowed to write. Never event_id or internal fields. */
const EventPageSchema = z.object({
  title:                      z.string().min(1, 'Title is required').max(200).trim().optional(),
  description:                z.string().max(20_000).optional(),
  starts_at:                  NullableDateTime.optional(),
  ends_at:                    NullableDateTime.optional(),
  timezone:                   z.string().max(60).optional(),
  venue_name:                 z.string().max(200).trim().optional(),
  venue_address:              z.string().max(400).trim().optional(),
  is_online:                  z.boolean().optional(),
  is_public:                  z.boolean().optional(),
  registration_deadline:      NullableDateTime.optional(),
  max_capacity:               z.number().int().min(1, 'Capacity must be at least 1').nullable().optional(),
  seo_title:                  z.string().max(60, 'SEO title should be 60 characters or less').trim().optional(),
  seo_description:            z.string().max(160, 'SEO description should be 160 characters or less').trim().optional(),
  cover_url:                  z.string().url('Invalid cover URL').nullable().optional()
                                .or(z.literal('')).transform(v => v === '' ? null : v),
  organizer_name:             z.string().max(100).trim().optional(),
  organizer_email:            z.string().email('Invalid organiser email').max(254).nullable().optional()
                                .or(z.literal('')).transform(v => v === '' ? null : v),
  organizer_website:          z.string().url('Invalid organiser website URL').max(500).nullable().optional()
                                .or(z.literal('')).transform(v => v === '' ? null : v),
  custom_slug:                z.string().max(100)
                                .regex(/^[a-z0-9-]*$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
                                .optional(),
  payment_processor:          z.enum(['stripe', 'flutterwave', 'waafipay', 'free']).optional(),
  show_remaining_tickets:     z.boolean().optional(),
  require_approval:           z.boolean().optional(),
  collect_attendee_details:   z.boolean().optional(),
  apply_vat:                  z.boolean().optional(),
  variant_id:                 z.string().uuid().nullable().optional(),
  city:                       z.string().max(100).trim().nullable().optional(),
  category:                   z.string().max(100).trim().nullable().optional(),
  series_name:                z.string().max(200).trim().nullable().optional(),
}).superRefine((data, ctx) => {
  // ends_at must be after starts_at when both provided
  if (data.starts_at && data.ends_at) {
    if (new Date(data.ends_at) <= new Date(data.starts_at)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date must be after start date', path: ['ends_at'] });
    }
  }
  // registration_deadline must be before starts_at when both provided
  if (data.registration_deadline && data.starts_at) {
    if (new Date(data.registration_deadline) >= new Date(data.starts_at)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Registration deadline must be before the event start date', path: ['registration_deadline'] });
    }
  }
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('event_pages')
    .select('*')
    .eq('event_id', params.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data ?? null });
}

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = EventPageSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Resolve series_id from series_name (create or find existing)
  let resolvedSeriesId: string | null | undefined = undefined;
  const { series_name, ...restData } = parsed.data;
  if (series_name !== undefined) {
    if (!series_name) {
      resolvedSeriesId = null; // clear the series
    } else {
      const slug = series_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) + '-' + Math.random().toString(36).slice(2, 6);

      // Try to find existing series by name + organizer
      const { data: existing } = await admin
        .from('event_series')
        .select('id, slug')
        .eq('organizer_id', user.id)
        .ilike('name', series_name)
        .limit(1)
        .maybeSingle();

      if (existing) {
        resolvedSeriesId = existing.id;
      } else {
        const { data: created } = await admin
          .from('event_series')
          .insert({ organizer_id: user.id, name: series_name, slug })
          .select('id')
          .single();
        resolvedSeriesId = created?.id ?? null;
      }
    }
  }

  // title is required by the DB type. Provide a fallback so upsert satisfies the type
  // even when the client is only updating other fields (DB will preserve the existing title).
  const upsertPayload: Record<string, unknown> = {
    title: 'Untitled Event',
    ...restData,
    event_id: params.id,
    updated_at: new Date().toISOString(),
    ...(series_name !== undefined ? { series_name: series_name || null } : {}),
    ...(resolvedSeriesId !== undefined ? { series_id: resolvedSeriesId } : {}),
  };

  const { data, error } = await admin
    .from('event_pages')
    .upsert(upsertPayload as unknown as Database['public']['Tables']['event_pages']['Insert'], { onConflict: 'event_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ page: data });
}
