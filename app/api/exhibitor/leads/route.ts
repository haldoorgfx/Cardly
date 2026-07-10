import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const RatingEnum = z.enum(['hot', 'warm', 'cold']);

const CreateLeadSchema = z.object({
  token:          z.string().min(1).max(200),
  attendee_name:  z.string().max(200).trim().optional().nullable(),
  attendee_email: z.string().max(254).email().optional().nullable().or(z.literal('')),
  company:        z.string().max(200).trim().optional().nullable(),
  role:           z.string().max(200).trim().optional().nullable(),
  rating:         RatingEnum.optional(),
  note:           z.string().max(2000).optional().nullable(),
});

const UpdateLeadSchema = z.object({
  token:   z.string().min(1).max(200),
  lead_id: z.string().uuid(),
  rating:  RatingEnum.optional(),
  note:    z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = CreateLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { token, attendee_name, attendee_email, company, role, rating, note } = parsed.data;

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
  const raw = await req.json().catch(() => null);
  const parsed = UpdateLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { token, lead_id, rating, note } = parsed.data;

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
