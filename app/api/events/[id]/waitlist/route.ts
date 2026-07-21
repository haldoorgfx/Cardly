import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendWaitlistConfirmEmail, sendWaitlistInviteEmail } from '@/lib/registration/email';
import { resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { escapeLikePattern } from '@/lib/search/filter';
import { isNotifAllowed } from '@/lib/notifications/prefs';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

export const dynamic = 'force-dynamic';

const joinSchema = z.object({
  name:  z.string().min(1).max(200),
  email: z.string().email(),
});

type PageRow = { id: string; title: string; starts_at: string | null; ends_at: string | null; city: string | null; event_id?: string | null; timezone?: string | null };

async function resolvePage(admin: ReturnType<typeof createAdminClient>, id: string): Promise<PageRow | null> {
  const { data: page } = await admin
    .from('event_pages')
    .select('id, title, starts_at, ends_at, city, event_id, timezone')
    .or(`custom_slug.eq.${id},id.eq.${id}`)
    .eq('is_public', true)
    .maybeSingle();
  if (page) return page as PageRow;

  // Fallback via events.slug
  const { data: event } = await admin.from('events').select('id').eq('slug', id).maybeSingle();
  if (!event) return null;
  const { data: ep } = await admin
    .from('event_pages')
    .select('id, title, starts_at, ends_at, city, event_id, timezone')
    .eq('event_id', event.id)
    .eq('is_public', true)
    .maybeSingle();
  return (ep as PageRow | null) ?? null;
}

// ── POST — join waitlist ───────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Name and valid email are required.' }, { status: 400 });
  }
  const { name, email } = parsed.data;

  const admin = createAdminClient();
  const page = await resolvePage(admin, params.id);
  if (!page) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  if (page.ends_at && new Date(page.ends_at) < new Date()) {
    return NextResponse.json({ error: 'This event has already ended — the waitlist is closed.' }, { status: 422 });
  }

  const lowerEmail = email.toLowerCase();

  // Already holding a ticket? Joining the queue for a seat you already have is
  // never what the person means, and it pads the organizer's queue with people
  // who will never take a released spot.
  if (page.event_id) {
    const { data: existingReg } = await admin
      .from('registrations')
      .select('id')
      .eq('event_id', page.event_id)
      .ilike('attendee_email', escapeLikePattern(lowerEmail))
      .in('status', ['confirmed', 'checked_in', 'pending_approval'])
      .maybeSingle();
    if (existingReg) {
      return NextResponse.json(
        { error: 'You are already registered for this event — no need to join the waitlist.' },
        { status: 409 },
      );
    }
  }

  // Re-joining must NOT rewrite the row. The old upsert reset status back to
  // 'waiting' (silently cancelling an invite the organizer had already sent)
  // and re-stamped position to the back of the queue — so anyone who submitted
  // the form twice lost their place and their offer. Read first, and only
  // insert when there is genuinely no entry yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('waitlist_entries')
    .select('id, status, created_at')
    .eq('event_page_id', page.id)
    .eq('email', lowerEmail)
    .maybeSingle();

  // Live position = how many people still waiting joined before you. Computed
  // from created_at rather than the stored `position` column, which goes stale
  // the moment anyone ahead is invited or expires.
  async function livePosition(createdAt: string | null): Promise<number> {
    const q = admin
      .from('waitlist_entries')
      .select('id', { count: 'exact', head: true })
      .eq('event_page_id', page!.id)
      .eq('status', 'waiting');
    const { count } = await (createdAt ? q.lt('created_at', createdAt) : q);
    return (count ?? 0) + 1;
  }

  if (existing) {
    if (existing.status === 'registered') {
      return NextResponse.json(
        { error: 'You are already registered for this event — no need to join the waitlist.' },
        { status: 409 },
      );
    }
    if (existing.status === 'invited') {
      return NextResponse.json(
        { error: 'You already have an invite for this event — check your email to claim your spot.' },
        { status: 409 },
      );
    }
    // Still waiting (or expired and re-trying): return their real place, do not
    // re-send the confirmation email or move them.
    if (existing.status === 'waiting') {
      return NextResponse.json({ position: await livePosition(existing.created_at) }, { status: 200 });
    }
  }

  const position = await livePosition(null);

  const { error } = await admin
    .from('waitlist_entries')
    .upsert(
      { event_page_id: page.id, email: lowerEmail, name, position, status: 'waiting' },
      { onConflict: 'event_page_id,email', ignoreDuplicates: false },
    );

  if (error) return NextResponse.json({ error: 'Could not join waitlist.' }, { status: 500 });

  // Awaited — an un-awaited promise is dropped when the response ends the
  // serverless invocation, so the "you're #N in line" mail never arrived.
  await sendWaitlistConfirmEmail({
    to: email.toLowerCase(),
    name,
    position,
    eventTitle: page.title,
    eventSlug: params.id,
    // timeZone is the EVENT's zone, not the server's. Vercel runs in UTC, so
    // without it a 20:00 event in Djibouti/Nairobi/Addis (UTC+3) printed the
    // previous day's date to the attendee.
    eventDate: page.starts_at
      ? new Date(page.starts_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: page.timezone ?? undefined })
      : '',
    city: page.city ?? null, eventId: page.event_id ?? undefined,
  }).catch(() => {});

  return NextResponse.json({ position }, { status: 201 });
}

// ── PATCH — organizer invites a waitlist entry (waiting → invited) ─────────────

const inviteSchema = z.object({ entry_id: z.string().uuid() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'entry_id required' }, { status: 400 });

  const admin = createAdminClient();

  // Verify organizer owns the event
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.id)
    .in('user_id', await manageableOwnerIds(user.id))
    .maybeSingle();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Promote atomically. invite_waitlist_entry (migration 115) puts the capacity
  // precondition inside the UPDATE's WHERE clause, so two simultaneous invites
  // with one seat left can no longer both succeed. Until that migration is
  // applied by hand the RPC does not exist — fall back to the previous
  // read-then-write path so this endpoint keeps working either way.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcResult, error: rpcErr } = await (admin as any)
    .rpc('invite_waitlist_entry', { p_entry_id: parsed.data.entry_id });

  if (!rpcErr && rpcResult) {
    if (rpcResult.status === 'full') {
      return NextResponse.json({ error: 'Cannot invite — the event is already at full capacity (counting invites already sent). Increase capacity or cancel existing registrations first.' }, { status: 409 });
    }
    if (rpcResult.status !== 'ok') {
      return NextResponse.json({ error: 'Entry not found or already invited' }, { status: 404 });
    }
  } else {
    // ── Fallback: pre-115 behaviour (read-then-write). ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: entryCheck } = await (admin as any)
      .from('waitlist_entries')
      .select('id, event_page_id')
      .eq('id', parsed.data.entry_id)
      .eq('status', 'waiting')
      .maybeSingle();

    if (entryCheck?.event_page_id) {
      const { data: epInvite } = await admin
        .from('event_pages')
        .select('max_capacity, event_id')
        .eq('id', entryCheck.event_page_id)
        .maybeSingle();
      if (epInvite?.max_capacity && epInvite.event_id) {
        const { count: confirmedCount } = await admin
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', epInvite.event_id)
          .in('status', ['confirmed', 'checked_in']);
        if ((confirmedCount ?? 0) >= epInvite.max_capacity) {
          return NextResponse.json({ error: 'Cannot invite — the event is already at full capacity. Increase capacity or cancel existing registrations first.' }, { status: 409 });
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: promoted, error: upErr } = await (admin as any)
      .from('waitlist_entries')
      .update({ status: 'invited', notified_at: new Date().toISOString() })
      .eq('id', parsed.data.entry_id)
      .eq('status', 'waiting')
      .select('id')
      .maybeSingle();
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    if (!promoted) return NextResponse.json({ error: 'Entry not found or already invited' }, { status: 404 });
  }

  // Read back the details needed for the invite email.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entry } = await (admin as any)
    .from('waitlist_entries')
    .select('email, name, event_pages(title, starts_at, timezone, custom_slug, event_id, events!inner(slug))')
    .eq('id', parsed.data.entry_id)
    .maybeSingle();

  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

  const ep = entry.event_pages;
  const eventSlug = ep?.custom_slug ?? ep?.events?.slug ?? params.id;

  // Respect the attendee's "Waitlist updates" preference (opt-out; default ON).
  // If the waitlisted person has an Eventera account and explicitly turned
  // waitlist notifications off, skip the email. Guests (no account) always get it.
  const waitlistAccountId = await resolveAccountIdByEmail(entry.email);
  const waitlistAllowed = waitlistAccountId
    ? await isNotifAllowed(waitlistAccountId, 'waitlist', 'email')
    : true;

  if (waitlistAllowed) {
    // Awaited — this is the time-critical "a spot opened up" mail; dropping it
    // silently costs the organizer a sale and the attendee their place.
    await sendWaitlistInviteEmail({
      to: entry.email,
      name: entry.name,
      eventTitle: ep?.title ?? '',
      eventSlug,
      // Event timezone, not the server's — see the POST handler above.
      eventDate: ep?.starts_at
        ? new Date(ep.starts_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: ep.timezone ?? undefined })
        : '',
      eventId: ep?.event_id ?? undefined,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
