import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendApprovedEmail, sendDeniedEmail } from '@/lib/registration/email';

export const dynamic = 'force-dynamic';

const schema = z.object({
  action: z.enum(['approve', 'deny']),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'action must be approve or deny' }, { status: 400 });

  const admin = createAdminClient();

  // Fetch registration and verify organizer owns the event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, qr_code_token, status, events!inner(id, user_id, slug, event_pages(title, starts_at, timezone, venue_name, is_online))')
    .eq('id', params.id)
    .maybeSingle();

  if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  if (reg.events?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (reg.status !== 'pending_approval') return NextResponse.json({ error: 'Registration is not pending approval' }, { status: 400 });

  if (parsed.data.action === 'approve') {
    const eventId = reg.events?.id;
    if (eventId) {
      const { data: ep } = await admin.from('event_pages').select('max_capacity').eq('event_id', eventId).maybeSingle();
      if (ep?.max_capacity) {
        const { count } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId).in('status', ['confirmed', 'checked_in']);
        if ((count ?? 0) >= ep.max_capacity) {
          return NextResponse.json({ error: 'Cannot approve — the event is at full capacity' }, { status: 409 });
        }
      }
    }
  }

  const newStatus = parsed.data.action === 'approve' ? 'confirmed' : 'cancelled';
  const { error: updateError } = await admin.from('registrations').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', params.id);
  if (updateError) return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });

  const ep = reg.events?.event_pages?.[0];
  const eventSlug = reg.events?.slug ?? params.id;
  const eventDate = ep?.starts_at
    ? new Date(ep.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: ep.timezone ?? undefined })
    : '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';

  if (parsed.data.action === 'approve') {
    sendApprovedEmail({
      to: reg.attendee_email,
      name: reg.attendee_name,
      eventTitle: ep?.title ?? '',
      eventSlug,
      eventDate,
      qrCodeUrl: `${appUrl}/api/qr/${reg.qr_code_token}`,
    }).catch(() => {});
  } else {
    sendDeniedEmail({
      to: reg.attendee_email,
      name: reg.attendee_name,
      eventTitle: ep?.title ?? '',
      eventSlug,
      eventDate,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
