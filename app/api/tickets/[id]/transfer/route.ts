import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select('id, event_id, attendee_email, status, qr_code_token')
    .eq('id', id)
    .or(`attendee_email.eq.${user.email?.toLowerCase()},user_id.eq.${user.id}`)
    .in('status', ['confirmed', 'pending_approval'])
    .maybeSingle();

  if (!reg) return NextResponse.json({ error: 'Ticket not found or not transferable' }, { status: 404 });

  const body = await req.json() as { recipientEmail: string; recipientName: string };
  const { recipientEmail, recipientName } = body;
  if (!recipientEmail || !recipientName) return NextResponse.json({ error: 'recipientEmail and recipientName required' }, { status: 400 });

  // Store pending transfer — using attendee_data JSONB for simplicity
  const expiresAt = new Date(Date.now() + 70 * 3600 * 1000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('registrations').update({
    attendee_data: {
      transfer_pending: true,
      transfer_to_email: recipientEmail.toLowerCase(),
      transfer_to_name: recipientName,
      transfer_expires: expiresAt,
      transfer_token: Math.random().toString(36).slice(2, 14),
    },
  }).eq('id', id);

  // In a real implementation, this would send an email. For now just return ok.
  return NextResponse.json({ ok: true, expiresAt });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('registrations').update({ attendee_data: null }).eq('id', id).or(`attendee_email.eq.${user.email?.toLowerCase()},user_id.eq.${user.id}`);

  return NextResponse.json({ ok: true });
}
