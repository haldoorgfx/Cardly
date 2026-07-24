import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

/**
 * Attendee -> exhibitor meeting request from the PUBLIC booth page.
 *
 * Migration 060 shipped `meeting_requests` and its RLS with the comment
 * "EX03 · meeting requests (attendee -> exhibitor)" and "this is the same
 * write an attendee makes from the public directory" — but that write only
 * ever existed in the Flutter app (sponsor_api.dart `requestMeeting`). No web
 * route or UI ever called it, so a web-only attendee had no way to reach a
 * booth's Meetings tab at all; the receiving side (the exhibitor Meetings
 * tab, built and working) had no producer on web.
 *
 * No login required — same posture as sponsor_leads and registrations
 * elsewhere in this app: public writes go through the service-role client
 * rather than the session client, so an attendee without an account can
 * still request a meeting.
 */
const CreateSchema = z.object({
  requester_name:  z.string().max(200).trim().optional().nullable(),
  requester_email: z.string().max(254).email(),
  message:         z.string().max(1000).trim().optional().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: { sponsorId: string } },
) {
  if (!(await isPlatformFeatureEnabled('sponsors'))) {
    return NextResponse.json({ error: 'Sponsors is currently unavailable.' }, { status: 404 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { requester_name, message } = parsed.data;
  const requesterEmail = parsed.data.requester_email.trim().toLowerCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin
    .from('sponsors')
    .select('id, event_id')
    .eq('id', params.sponsorId)
    .maybeSingle();
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // meeting_requests has no unique constraint or DB-side rate limit — mirror
  // the mobile app's best-effort per-sponsor throttle so one visitor can't
  // flood a booth's request queue.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('meeting_requests')
    .select('id', { count: 'exact', head: true })
    .eq('sponsor_id', sponsor.id)
    .eq('requester_email', requesterEmail)
    .gte('created_at', since);
  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "You've already sent a few requests to this booth recently. Please wait a bit before sending another." },
      { status: 429 },
    );
  }

  const { error } = await admin.from('meeting_requests').insert({
    sponsor_id: sponsor.id,
    event_id: sponsor.event_id,
    requester_name: requester_name || null,
    requester_email: requesterEmail,
    message: message || null,
    status: 'pending',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
