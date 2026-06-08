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
