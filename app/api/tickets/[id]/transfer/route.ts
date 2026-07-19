import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { registrationOwnershipFilter } from '@/lib/registration/ownership';
import { sendTransferEmail } from '@/lib/registration/email';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  recipientEmail: z.string().email().max(254).transform(v => v.toLowerCase().trim()),
  recipientName: z.string().min(1).max(200).trim(),
});

/**
 * Transfer a ticket (registration) to another person.
 *
 * Sensitive ownership change — only the current owner (matched by
 * attendee_email OR user_id on the authenticated session) may transfer, and
 * only tickets in a transferable status. On success the registration's
 * attendee_name / attendee_email are reassigned, the previous owner's
 * user_id link is cleared (so the sender loses access), the transfer is logged
 * in ticket_transfers, and the new holder is emailed their QR.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A recipient name and a valid email are required.' }, { status: 400 });
  }
  const { recipientEmail, recipientName } = parsed.data;

  const admin = createAdminClient();

  // Fetch registration — must belong to the logged-in user (owner-only).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, qr_code_token, status, events!inner(slug, event_pages(title, starts_at))')
    .eq('id', id)
    .or(registrationOwnershipFilter(user.id, user.email))
    .in('status', ['confirmed', 'pending_approval'])
    .maybeSingle();

  if (!reg) return NextResponse.json({ error: 'Ticket not found or not transferable.' }, { status: 404 });

  // Idempotency / no-op guard: transferring to the current holder changes nothing.
  if ((reg.attendee_email ?? '').toLowerCase() === recipientEmail) {
    return NextResponse.json({ error: 'This ticket already belongs to that email.' }, { status: 400 });
  }

  // Log the transfer (audit trail).
  const { error: transferError } = await admin.from('ticket_transfers').insert({
    registration_id: id,
    from_name: reg.attendee_name ?? '',
    from_email: reg.attendee_email ?? '',
    to_name: recipientName,
    to_email: recipientEmail,
  });
  if (transferError) return NextResponse.json({ error: 'Failed to record transfer.' }, { status: 500 });

  // Rotate the QR token so the previous owner's saved QR can no longer scan.
  // Matches how qr_code_token is minted elsewhere (crypto.randomUUID, hyphens stripped).
  const newToken = crypto.randomUUID().replace(/-/g, '');

  // Reassign the registration and sever the previous owner's account link.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any).from('registrations').update({
    attendee_name: recipientName,
    attendee_email: recipientEmail,
    qr_code_token: newToken,
    user_id: null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (updateError) return NextResponse.json({ error: 'Failed to transfer ticket.' }, { status: 500 });

  // Email the new holder their QR + event link (best-effort, never blocks the transfer).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ep = (reg.events?.event_pages as any[])?.[0];
  const eventSlug = reg.events?.slug ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  // Awaited — a dropped send means the new holder never receives the ticket.
  await sendTransferEmail({
    to: recipientEmail,
    name: recipientName,
    eventTitle: ep?.title ?? '',
    eventSlug,
    qrCodeUrl: `${appUrl}/api/qr/${newToken}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
