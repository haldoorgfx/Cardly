import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { name: string; email: string; phone?: string; ticketId?: string; payment?: string };
  const { name, email, phone, ticketId, payment } = body;
  if (!name || !email) return NextResponse.json({ error: 'name and email required' }, { status: 400 });

  // Generate QR token
  const qr = Math.random().toString(36).slice(2, 10).toUpperCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg, error } = await (admin as any).from('registrations').insert({
    event_id: id,
    attendee_name: name,
    attendee_email: email.toLowerCase(),
    attendee_phone: phone ?? null,
    ticket_type_id: ticketId ?? null,
    status: 'checked_in',
    qr_code_token: qr,
    amount_paid: 0,
    source: 'walk_in',
    payment_method: payment ?? 'cash',
    checked_in_at: new Date().toISOString(),
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: reg.id, ticket_number: qr });
}
