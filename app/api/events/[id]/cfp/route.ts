import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { z } from 'zod';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

/**
 * Organizer read/write for `call_for_papers` (migration 023).
 *
 * WHY THIS DID NOT EXIST
 *   The public submission form (app/(public)/e/[slug]/cfp) and the organizer
 *   review screen (app/(app)/events/[id]/abstracts) were both built and both
 *   read this table — but nothing anywhere ever wrote to it. There was no
 *   organizer UI, no API route, not even an admin-only script: a
 *   `call_for_papers` row could only come from someone pasting SQL into the
 *   Supabase editor by hand. So the public page always rendered "Abstract
 *   submissions are not currently open" and the review screen's empty state
 *   linked to a page that could never open — a fully-built feature with no
 *   switch to turn it on, for every event, since the day it shipped.
 *
 * `unique(event_id)` on the table (023) makes this an upsert-by-event, not a
 * plain insert — a second "save" from the settings panel updates the same row.
 */

const CfpSchema = z.object({
  is_open: z.boolean().optional(),
  deadline_at: z.string().nullable().optional(),
  max_words: z.number().int().min(50).max(20000).optional(),
  categories: z.array(z.string().min(1).max(120)).max(30).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('speakers'))) {
    return NextResponse.json({ error: 'Speakers & CFP is currently unavailable.' }, { status: 404 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events').select('id').eq('id', params.id)
    .in('user_id', await manageableOwnerIds(user.id)).maybeSingle();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cfp } = await (admin as any)
    .from('call_for_papers')
    .select('id, is_open, deadline_at, max_words, categories')
    .eq('event_id', params.id)
    .maybeSingle();

  return NextResponse.json({ cfp: cfp ?? null });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('speakers'))) {
    return NextResponse.json({ error: 'Speakers & CFP is currently unavailable.' }, { status: 404 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = CfpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events').select('id').eq('id', params.id)
    .in('user_id', await manageableOwnerIds(user.id)).maybeSingle();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.is_open !== undefined) patch.is_open = body.is_open;
  if (body.deadline_at !== undefined) patch.deadline_at = body.deadline_at || null;
  if (body.max_words !== undefined) patch.max_words = body.max_words;
  if (body.categories !== undefined) patch.categories = body.categories;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cfp, error } = await (admin as any)
    .from('call_for_papers')
    .upsert(
      { event_id: params.id, ...patch },
      { onConflict: 'event_id' },
    )
    .select('id, is_open, deadline_at, max_words, categories')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cfp });
}
