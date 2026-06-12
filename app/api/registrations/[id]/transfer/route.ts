import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendTransferEmail } from '@/lib/registration/email';

export const dynamic = 'force-dynamic';

const schema = z.object({
  to_name:  z.string().min(1).max(200).trim(),
  to_email: z.string().email().max(254).transform(v => v.toLowerCase()),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Name and valid email are required.' }, { status: 400 });

  const admin = createAdminClient();

  // Fetch registration — must belong to the logged-in user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, qr_code_token, status, events!inner(slug, event_pages(title, starts_at))')
    .eq('id', params.id)
    .eq('attendee_email', user.email)
    .in('status', ['confirmed', 'pending_approval'])
    .maybeSingle();

  if (!reg) return NextResponse.json({ error: 'Registration not found or not transferable' }, { status: 404 });

  const { to_name, to_email } = parsed.data;

  // Log the transfer
  const { error: transferError } = await admin.from('ticket_transfers').insert({
    registration_id: params.id,
    from_name: reg.attendee_name,
    from_email: reg.attendee_email,
    to_name,
    to_email,
  });
  if (transferError) return NextResponse.json({ error: 'Failed to log transfer' }, { status: 500 });

  // Update the registration
  const { error: updateError } = await admin.from('registrations').update({
    attendee_name: to_name,
    attendee_email: to_email,
    updated_at: new Date().toISOString(),
  }).eq('id', params.id);
  if (updateError) return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });

  // Email the new holder
  const ep = reg.events?.event_pages?.[0];
  const eventSlug = reg.events?.slug ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';

  sendTransferEmail({
    to: to_email,
    name: to_name,
    eventTitle: ep?.title ?? '',
    eventSlug,
    qrCodeUrl: `${appUrl}/api/qr/${reg.qr_code_token}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
