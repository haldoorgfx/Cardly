import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const admin = createAdminClient();
  const body = await req.json() as {
    eventSlug: string;
    title: string;
    abstract: string;
    keywords: string[];
    category: string;
    primaryAuthor: { name: string; email: string; affiliation: string };
    presenting: boolean;
    coAuthors: { name: string; email: string; affiliation: string }[];
  };

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
