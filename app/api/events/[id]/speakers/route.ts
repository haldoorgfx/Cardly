import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const SpeakerSchema = z.object({
  name: z.string().min(1),
  headline: z.string().optional(),
  bio: z.string().optional(),
  photo_url: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  linkedin_url: z.string().optional(),
  twitter_url: z.string().optional(),
  website_url: z.string().optional(),
  speaker_type: z.enum(['keynote', 'speaker', 'panelist', 'workshop', 'mc']).default('speaker'),
  is_featured: z.boolean().default(false),
  position: z.number().int().default(0),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('speakers')
    .select('*')
    .eq('event_id', params.id)
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ speakers: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = SpeakerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await admin
    .from('speakers')
    .insert({ event_id: params.id, ...parsed.data })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ speaker: data }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { speakerId, ...updates } = await req.json();
  if (!speakerId) return NextResponse.json({ error: 'speakerId required' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('speakers')
    .update(updates)
    .eq('id', speakerId)
    .eq('event_id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ speaker: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const speakerId = searchParams.get('speakerId');
  if (!speakerId) return NextResponse.json({ error: 'speakerId required' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('speakers').delete().eq('id', speakerId).eq('event_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
