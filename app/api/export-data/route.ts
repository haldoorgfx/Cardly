import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { registrationOwnershipFilter } from '@/lib/registration/ownership';

// "Download your data" — the caller's OWN data only, never anyone else's.
//
// This is the counterpart to account deletion: the user is told their data is
// removed permanently, so they need a way to take a copy first. It is linked
// from the Settings danger zone, next to Delete.
//
// Scope note: everything below is keyed to the caller. Registrations for events
// the caller ORGANISES are deliberately NOT included — those are other
// attendees' personal data, and this endpoint is "my data", not "all data I can
// see". The organizer-facing attendee export lives behind the event's own
// export route, where event ownership is checked.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // The networking columns (bio, job_title, industry, …) were added in migration
  // 048 and are not in the frozen types/database.ts, so cast at the DB boundary —
  // same idiom as app/(app)/settings/page.tsx.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const [{ data: profile }, { data: events }] = await Promise.all([
    // This previously selected five columns (email, full_name, plan, role,
    // created_at) and called itself a data export, while the profile actually
    // stores bio, phone, city, interests, goals, job title, employer and social
    // links. An export that omits most of the PII you hold is not an export.
    db
      .from('profiles')
      .select(
        'email, full_name, plan, role, created_at, avatar_url, phone, city, bio, ' +
        'organization, job_title, industry, role_types, interests, goals, ' +
        'directory_visible, open_to_connect, linkedin_url, x_url, ' +
        'language, timezone, currency, notification_prefs',
      )
      .eq('id', user.id)
      // .single() 500s the whole export if the row is missing; the rest of the
      // payload is still worth returning.
      .maybeSingle(),
    admin
      .from('events')
      .select('id, name, slug, status, view_count, download_count, created_at, updated_at')
      .eq('user_id', user.id),
  ]);

  // The caller's own tickets — the most important thing to walk away with, and
  // precisely what account deletion destroys. Uses the shared ownership filter
  // (user_id OR non-empty attendee_email) rather than a hand-rolled `.or()`:
  // that helper exists because `attendee_email.eq.` on an account with no email
  // matches every blank-email registration and leaks other people's tickets.
  const { data: registrations } = await admin
    .from('registrations')
    .select('id, event_id, attendee_name, attendee_email, status, amount_paid, created_at')
    .or(registrationOwnershipFilter(user.id, (profile as { email?: string | null } | null)?.email ?? user.email))
    .order('created_at', { ascending: false });

  // generated_cards link to events, not directly to the user — fetch full rows for GDPR completeness
  const eventIds = (events ?? []).map(e => e.id);
  let generatedCards: Array<{ id: string; event_id: string; attendee_name: string | null; attendee_data: unknown; output_url: string | null; created_at: string }> = [];
  if (eventIds.length > 0) {
    const { data: cards } = await admin
      .from('generated_cards')
      .select('id, event_id, attendee_name, attendee_data, output_url, created_at')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });
    generatedCards = cards ?? [];
  }

  const exportPayload = {
    exported_at: new Date().toISOString(),
    profile: { id: user.id, ...profile },
    events: events ?? [],
    registrations: registrations ?? [],
    generated_cards: generatedCards,
  };

  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="eventera-data-export.json"',
      // A file of the user's PII must not be retained by a proxy or the browser.
      'Cache-Control': 'no-store, private',
    },
  });
}
