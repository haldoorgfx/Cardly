import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { canCreateEvent, getUserPlan } from '@/lib/billing/can';
import { generateSlug } from '@/lib/slug';
import { upsertEventRole } from '@/lib/rbac/assign';
import { checkTemplate, applyTemplateToEvent } from '@/lib/templates/apply';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await canCreateEvent(user.id);
  if (!allowed) return NextResponse.json({ error: 'PLAN_LIMIT' }, { status: 402 });

  const body = await req.json().catch(() => ({}));
  const rawName = (body.name as string | undefined)?.trim() || 'Untitled Event';
  const name = rawName.slice(0, 200);

  // Dates are validated UP FRONT, before anything is written.
  // event_pages.starts_at / ends_at are NOT NULL (migration 017), so a dateless
  // quick-create used to insert `null`, hit a constraint violation, and — because
  // the insert error was never checked — return 201 for an event that had no
  // event_pages row at all: no public page, no register route, no cover, and a
  // Publish screen with blank dates. Refuse the request instead of half-creating.
  const startsAtRaw = typeof body.starts_at === 'string' ? body.starts_at.trim() : '';
  const endsAtRaw   = typeof body.ends_at   === 'string' ? body.ends_at.trim()   : '';
  if (!startsAtRaw) return NextResponse.json({ error: 'Add a start date and time for your event.' }, { status: 400 });
  if (!endsAtRaw)   return NextResponse.json({ error: 'Add an end date and time for your event.' }, { status: 400 });

  const startsAt = new Date(startsAtRaw);
  const endsAt   = new Date(endsAtRaw);
  if (Number.isNaN(startsAt.getTime())) return NextResponse.json({ error: 'The start date is not a valid date and time.' }, { status: 400 });
  if (Number.isNaN(endsAt.getTime()))   return NextResponse.json({ error: 'The end date is not a valid date and time.' }, { status: 400 });
  // Mirrors the chk_event_page_date_order constraint (migration 028).
  if (endsAt.getTime() <= startsAt.getTime()) {
    return NextResponse.json({ error: 'The end date must be after the start date.' }, { status: 400 });
  }

  const venueName    = (body.venue_name    as string | undefined) ?? null;
  const venueAddress = (body.venue_address as string | undefined) ?? null;
  const venueLat     = typeof body.venue_lat === 'number' ? body.venue_lat : null;
  const venueLng     = typeof body.venue_lng === 'number' ? body.venue_lng : null;
  const city         = (body.city          as string | undefined) ?? null;
  const country      = (body.country       as string | undefined) ?? null;
  const isOnline     = body.is_online === true;

  // An optional card template chosen on /templates. Validated BEFORE anything is
  // written — an unknown id or a plan-gated template must fail with nothing left
  // behind, not after the event row already exists.
  const templateId = typeof body.template_id === 'string' ? body.template_id.trim() : '';
  const plan = await getUserPlan(user.id);
  if (templateId) {
    const check = await checkTemplate(templateId, plan);
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error === 'PLAN_LIMIT' ? 'That template needs a higher plan.' : check.error },
        { status: check.status },
      );
    }
  }

  const admin = createAdminClient();

  // Ensure a profile row exists — guards against signup trigger failures.
  // This is a no-op for users who already have a row (ignoreDuplicates: true).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('profiles').upsert(
    { id: user.id, email: user.email ?? '', full_name: (user.user_metadata?.full_name as string) || '' },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  // Retry up to 3 times on slug collision
  let event: { id: string; slug: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateSlug(name);

    const { data, error: dbError } = await admin
      .from('events')
      .insert({
        user_id: user.id,
        name,
        slug,
        // zones omitted — DB default is '[]'::jsonb; avoids schema cache issues
        status: 'draft' as const,
      })
      .select('id, slug')
      .single();

    if (!dbError) { event = data; break; }
    if (dbError.code !== '23505') return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!event) return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 500 });

  // Create a draft event_pages row immediately so the event page editor
  // has something to work with and /e/[slug]/register resolves after publish.
  // is_public = false — stays private until the organiser clicks Publish.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: pageError } = await (admin as any).from('event_pages').insert({
    event_id:      event.id,
    title:         name,
    is_public:     false,
    is_online:     isOnline,
    venue_name:    venueName,
    venue_address: venueAddress,
    venue_lat:     venueLat,
    venue_lng:     venueLng,
    city,
    country,
    starts_at:     startsAt.toISOString(),
    ends_at:       endsAt.toISOString(),
  });

  // An event without its event_pages row is a broken shell — the public page,
  // the register route, and the Publish screen all read from event_pages. Undo
  // the event row so the organizer retries a clean create instead of finding a
  // half-built event in their list.
  if (pageError) {
    try { await admin.from('events').delete().eq('id', event.id); } catch { /* best-effort */ }
    return NextResponse.json({ error: 'Could not create the event page. Please try again.' }, { status: 500 });
  }

  // Roles write-path: the creator is the organizer of this event (belt-and-suspenders).
  await upsertEventRole({ userId: user.id, eventId: event.id, role: 'organizer' });

  // Apply the chosen card template on top of the now-complete event. Soft-fail:
  // the event and its page are already valid, so a template problem downgrades
  // to a warning the wizard shows rather than losing the whole creation.
  let templateWarning: string | null = null;
  if (templateId) {
    const applied = await applyTemplateToEvent({ eventId: event.id, userId: user.id, templateId, plan });
    if (!applied.ok) {
      console.warn(`[create-basic] template ${templateId} failed for event ${event.id}: ${applied.error}`);
      templateWarning = 'Your event was created, but the template design could not be applied. Pick one again in Card Studio.';
    }
  }

  return NextResponse.json({ id: event.id, slug: event.slug, template_warning: templateWarning }, { status: 201 });
}
