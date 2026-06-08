import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { token, attendee_name, attendee_email, company, role, rating, note } = body;

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin
    .from('sponsors')
    .select('id, event_id')
    .eq('invite_token', token)
    .single();

  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: lead, error } = await admin
    .from('sponsor_leads')
    .insert({
      sponsor_id:    sponsor.id,
      event_id:      sponsor.event_id,
      attendee_name: attendee_name || null,
      attendee_email: attendee_email || null,
      company:       company || null,
      role:          role || null,
      rating:        rating || 'warm',
      note:          note || null,
      captured_at:   new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lead });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { token, lead_id, rating, note } = body;

  if (!token || !lead_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin.from('sponsors').select('id').eq('invite_token', token).single();
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (rating !== undefined) patch.rating = rating;
  if (note !== undefined) patch.note = note;

  const { data: lead, error } = await admin
    .from('sponsor_leads')
    .update(patch)
    .eq('id', lead_id)
    .eq('sponsor_id', sponsor.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('id');
  const token  = searchParams.get('token');

  if (!leadId || !token) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin.from('sponsors').select('id').eq('invite_token', token).single();
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await admin.from('sponsor_leads').delete().eq('id', leadId).eq('sponsor_id', sponsor.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
