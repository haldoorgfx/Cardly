import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendWaitlistConfirmEmail, sendWaitlistInviteEmail } from '@/lib/registration/email';

export const dynamic = 'force-dynamic';

const joinSchema = z.object({
  name:  z.string().min(1).max(200),
  email: z.string().email(),
});

type PageRow = { id: string; title: string; starts_at: string | null; ends_at: string | null; city: string | null; event_id?: string | null };

async function resolvePage(admin: ReturnType<typeof createAdminClient>, id: string): Promise<PageRow | null> {
  const { data: page } = await admin
    .from('event_pages')
    .select('id, title, starts_at, ends_at, city, event_id')
    .or(`custom_slug.eq.${id},id.eq.${id}`)
    .eq('is_public', true)
    .maybeSingle();
  if (page) return page as PageRow;

  // Fallback via events.slug
  const { data: event } = await admin.from('events').select('id').eq('slug', id).maybeSingle();
  if (!event) return null;
  const { data: ep } = await admin
    .from('event_pages')
    .select('id, title, starts_at, ends_at, city, event_id')
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

  // Count existing waiting entries for position
  const { count } = await admin
    .from('waitlist_entries')
    .select('id', { count: 'exact', head: true })
    .eq('event_page_id', page.id)
    .eq('status', 'waiting');

  const position = (count ?? 0) + 1;

  // Upsert — same email re-joins without error
  const { error } = await admin
    .from('waitlist_entries')
    .upsert(
      { event_page_id: page.id, email: email.toLowerCase(), name, position, status: 'waiting' },
      { onConflict: 'event_page_id,email', ignoreDuplicates: false },
    );

  if (error) return NextResponse.json({ error: 'Could not join waitlist.' }, { status: 500 });

  sendWaitlistConfirmEmail({
    to: email.toLowerCase(),
    name,
    position,
    eventTitle: page.title,
    eventSlug: params.id,
    eventDate: page.starts_at
      ? new Date(page.starts_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '',
    city: page.city ?? null,
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
    .eq('user_id', user.id)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch entry first to check capacity before promoting
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
  const { data: entry, error } = await (admin as any)
    .from('waitlist_entries')
    .update({ status: 'invited', notified_at: new Date().toISOString() })
    .eq('id', parsed.data.entry_id)
    .eq('status', 'waiting')
    .select('email, name, event_pages(title, starts_at, custom_slug, events!inner(slug))')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!entry) return NextResponse.json({ error: 'Entry not found or already invited' }, { status: 404 });

  const ep = entry.event_pages;
  const eventSlug = ep?.custom_slug ?? ep?.events?.slug ?? params.id;

  sendWaitlistInviteEmail({
    to: entry.email,
    name: entry.name,
    eventTitle: ep?.title ?? '',
    eventSlug,
    eventDate: ep?.starts_at
      ? new Date(ep.starts_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '',
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
