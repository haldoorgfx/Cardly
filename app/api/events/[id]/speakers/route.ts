import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { z } from 'zod';
import { slugifyBase } from '@/lib/slug';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

function speakerSlug(name: string, id: string): string {
  const base = slugifyBase(name, 40);
  return `${base}-${id.replace(/-/g, '').slice(0, 8)}`;
}

/**
 * Every method here uses the service-role admin client, which BYPASSES RLS —
 * so each one must prove the caller may manage this event. Returns the event
 * row or null; callers 404 on null (same shape the POST handler already used).
 *
 * Was a literal `.eq('user_id', userId)` — POST already used manageableOwnerIds
 * (below), but GET/PATCH/DELETE still called this helper, so a Studio team
 * member could create a speaker yet not view, edit, or delete one — the
 * exact "Teams granted access to nothing" regression this file had half-fixed.
 */
async function ownedEvent(eventId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('events')
    .select('id')
    .eq('id', eventId)
    .in('user_id', await manageableOwnerIds(userId))
    .maybeSingle();
  return data;
}

const SpeakerSchema = z.object({
  name: z.string().min(1),
  headline: z.string().optional(),
  bio: z.string().optional(),
  photo_url: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  email: z.string().optional(),
  linkedin_url: z.string().optional(),
  twitter_url: z.string().optional(),
  website_url: z.string().optional(),
  speaker_type: z.enum(['keynote', 'speaker', 'panelist', 'workshop', 'mc']).default('speaker'),
  is_featured: z.boolean().default(false),
  position: z.number().int().default(0),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('speakers'))) return NextResponse.json({ error: 'Speakers & CFP is currently unavailable.' }, { status: 404 });

  // Organizer-only: speakers rows carry `email` (migration 039). This route was
  // unauthenticated, so anyone who knew an event id could dump every speaker's
  // private address. Its only caller is the dashboard SpeakersManager.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await ownedEvent(params.id, user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('speakers')
    .select('*')
    .eq('event_id', params.id)
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ speakers: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('speakers'))) return NextResponse.json({ error: 'Speakers & CFP is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SpeakerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Insert without slug first to get the generated id, then update with slug
  const { data, error } = await admin
    .from('speakers')
    .insert({ event_id: params.id, ...parsed.data })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Backfill slug now that we have the id
  await admin.from('speakers').update({ slug: speakerSlug(data.name, data.id) }).eq('id', data.id);

  // Roles write-path: if the speaker has an email tied to an account, grant the
  // 'speaker' role for this event. Best-effort; only writes when an account matches.
  if (parsed.data.email) {
    const speakerAccountId = await resolveAccountIdByEmail(parsed.data.email);
    if (speakerAccountId) {
      await upsertEventRole({ userId: speakerAccountId, eventId: params.id, role: 'speaker' });
    }
  }

  return NextResponse.json({ speaker: { ...data, slug: speakerSlug(data.name, data.id) } }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('speakers'))) return NextResponse.json({ error: 'Speakers & CFP is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { speakerId, ...updates } = await req.json();
  if (!speakerId) return NextResponse.json({ error: 'speakerId required' }, { status: 400 });

  // `.eq('event_id', params.id)` alone only proves the speaker belongs to THAT
  // event — not that the caller owns it. Without this check any signed-in user
  // could rewrite (or re-point the `email` of, and so hand themselves ownership
  // of) any speaker on the platform.
  if (!(await ownedEvent(params.id, user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Whitelist the updatable columns — a raw spread let the caller set `id`,
  // `event_id` (moving the row to another event) or `slug` (hijacking another
  // speaker's public URL).
  const parsed = SpeakerSchema.partial().safeParse(updates);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('speakers')
    .update(parsed.data)
    .eq('id', speakerId)
    .eq('event_id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep the roles table in step when the organizer sets/changes the email —
  // same write-path POST uses, otherwise an edited-in speaker never gets access.
  if (parsed.data.email) {
    const speakerAccountId = await resolveAccountIdByEmail(parsed.data.email);
    if (speakerAccountId) {
      await upsertEventRole({ userId: speakerAccountId, eventId: params.id, role: 'speaker' });
    }
  }

  return NextResponse.json({ speaker: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('speakers'))) return NextResponse.json({ error: 'Speakers & CFP is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const speakerId = searchParams.get('speakerId');
  if (!speakerId) return NextResponse.json({ error: 'speakerId required' }, { status: 400 });

  // Admin client bypasses RLS — prove the caller owns this event before deleting.
  if (!(await ownedEvent(params.id, user.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = createAdminClient();

  const { count: sessionCount } = await admin
    .from('session_speakers')
    .select('id', { count: 'exact', head: true })
    .eq('speaker_id', speakerId);
  if ((sessionCount ?? 0) > 0) {
    return NextResponse.json({
      error: `Cannot delete this speaker — they are assigned to ${sessionCount} session${sessionCount === 1 ? '' : 's'}. Remove them from all sessions first.`,
    }, { status: 409 });
  }

  const { error } = await admin.from('speakers').delete().eq('id', speakerId).eq('event_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
