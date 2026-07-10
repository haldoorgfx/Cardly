import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const AuthorSchema = z.object({
  name:        z.string().min(1).max(200).trim(),
  email:       z.string().max(254).email().optional().or(z.literal('')),
  affiliation: z.string().max(300).trim().optional().or(z.literal('')),
});

const CfpSchema = z.object({
  eventSlug:     z.string().min(1).max(200),
  title:         z.string().min(1).max(300).trim(),
  abstract:      z.string().min(1).max(10000),
  keywords:      z.array(z.string().max(60)).max(20).default([]),
  category:      z.string().max(120).default(''),
  primaryAuthor: AuthorSchema,
  presenting:    z.boolean().default(false),
  coAuthors:     z.array(AuthorSchema).max(20).default([]),
});

export async function POST(req: NextRequest) {
  const admin = createAdminClient();

  const raw = await req.json().catch(() => null);
  const parsed = CfpSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const body = parsed.data;

  // Resolve event by slug
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('slug', body.eventSlug)
    .single();

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Get CFP config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cfp } = await (admin as any)
    .from('call_for_papers')
    .select('id, is_open')
    .eq('event_id', event.id)
    .single();

  if (!cfp || !cfp.is_open) {
    return NextResponse.json({ error: 'Submissions are closed' }, { status: 400 });
  }

  const authorsJson = [
    { ...body.primaryAuthor, presenting: body.presenting },
    ...body.coAuthors.map(a => ({ ...a, presenting: false })),
  ];

  const authorsDenorm = authorsJson
    .filter(a => a.name)
    .map(a => `${a.name}${a.affiliation ? ` (${a.affiliation})` : ''}`)
    .join(' · ');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: abstract, error } = await (admin as any)
    .from('abstracts')
    .insert({
      event_id: event.id,
      cfp_id: cfp.id,
      title: body.title,
      body: body.abstract,
      authors: authorsDenorm,
      authors_json: authorsJson,
      keywords: body.keywords,
      category: body.category,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ abstract });
}
