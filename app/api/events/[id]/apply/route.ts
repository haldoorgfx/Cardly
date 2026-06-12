import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { answers, name, email } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: event } = await db.from('events').select('id').eq('id', id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await db.from('registrations').insert({
    event_id: id,
    attendee_name: name ?? 'Applicant',
    attendee_email: email ?? null,
    attendee_data: { answers },
    status: 'pending_approval',
    source: 'application_form',
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
