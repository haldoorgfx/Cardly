import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { sendAbstractReceivedEmail } from '@/lib/email';
import { z } from 'zod';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

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
  if (!(await isPlatformFeatureEnabled('speakers'))) return NextResponse.json({ error: 'Speakers & CFP is currently unavailable.' }, { status: 404 });

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

  // Resolve the slug the SAME way the CFP page that rendered this form does
  // (app/(public)/e/[slug]/cfp/page.tsx → resolvePublicSlug). Matching only
  // `events.slug` here meant any event using a custom slug rendered a perfectly
  // working submission form whose Submit button answered "Event not found" —
  // the page and its own API disagreed about what a slug is.
  const resolved = await resolvePublicSlug(body.eventSlug);
  if (!resolved) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  const event = resolved.event;

  // Get CFP config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cfp } = await (admin as any)
    .from('call_for_papers')
    .select('id, is_open, deadline_at, max_words')
    .eq('event_id', event.id)
    .single();

  if (!cfp || !cfp.is_open) {
    return NextResponse.json({ error: 'Submissions are closed' }, { status: 400 });
  }

  // The deadline was decoration. `deadline_at` was rendered on the page as a
  // pill and a "N days remaining" countdown, and then never consulted again —
  // the form stayed live and this route accepted submissions indefinitely after
  // it passed, silently mixing late papers into the review queue. `is_open` is
  // a manual switch an organiser has to remember to flip; the date they
  // published is the promise attendees actually read.
  if (cfp.deadline_at && new Date(cfp.deadline_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: 'The deadline for submissions has passed' },
      { status: 422 },
    );
  }

  // max_words is the organiser's configured limit. The form shows a live
  // counter against it but nothing stopped a submission going over, so the cap
  // was advisory only.
  const maxWords = typeof cfp.max_words === 'number' && cfp.max_words > 0 ? cfp.max_words : 400;
  const wordCount = body.abstract.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > maxWords) {
    return NextResponse.json(
      { error: `Your abstract is ${wordCount} words — the limit is ${maxWords}.` },
      { status: 422 },
    );
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

  // The form's last line before the Submit button reads "You'll receive a
  // confirmation email." Nothing sent one. AWAITED, not fire-and-forget: on
  // serverless the response ends the invocation, so a floating promise here is
  // simply dropped — the recurring bug in this codebase.
  if (body.primaryAuthor.email) {
    await sendAbstractReceivedEmail({
      to: body.primaryAuthor.email,
      authorName: body.primaryAuthor.name,
      abstractTitle: body.title,
      eventName: event.name,
    }).catch(() => {/* mail is best-effort; the submission is already saved */});
  }

  return NextResponse.json({ abstract });
}
