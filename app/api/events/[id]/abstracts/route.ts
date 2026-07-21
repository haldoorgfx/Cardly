import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { sendAbstractDecisionEmail } from '@/lib/email';
import { z } from 'zod';

/** The exact set the abstracts.status CHECK constraint allows (migration 023). */
const STATUSES = ['pending', 'accept', 'reject', 'revision', 'waitlist'] as const;
type AbstractStatus = (typeof STATUSES)[number];

/** Decisions the author is told about. 'pending' is a reviewer un-deciding. */
const NOTIFIED: readonly AbstractStatus[] = ['accept', 'reject', 'revision', 'waitlist'];

// `status` used to be raw `string` off the request body and was written
// straight through. Anything outside the CHECK constraint came back as a
// Postgres error message in a 500, and anything inside it was accepted from a
// hand-rolled request regardless of what the UI offers.
const PatchSchema = z.object({
  abstractId: z.string().uuid(),
  status: z.enum(STATUSES).optional(),
  review_notes: z.string().max(5000).optional(),
  assigned_session: z.string().uuid().nullable().optional().or(z.literal('')),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function primaryAuthorOf(authorsJson: any): { name: string; email: string } | null {
  const authors = Array.isArray(authorsJson) ? authorsJson : [];
  const withEmail = authors.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => typeof a?.email === 'string' && a.email.includes('@'),
  );
  if (withEmail.length === 0) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presenting = withEmail.find((a: any) => a?.presenting === true);
  const chosen = presenting ?? withEmail[0];
  return { name: String(chosen.name ?? 'there'), email: String(chosen.email) };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify event ownership
  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('id', params.id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const body = parsed.data;

  const patch = {
    ...(body.review_notes !== undefined && { review_notes: body.review_notes }),
    ...(body.assigned_session !== undefined && {
      assigned_session: body.assigned_session || null,
    }),
    updated_at: new Date().toISOString(),
  };

  const SELECT = 'id, title, status, review_notes, assigned_session, authors, authors_json, category, keywords, body, pdf_url, submitted_at';

  // A reviewer pressing "Save decision" twice must not mail the author twice.
  // The precondition lives in the WHERE clause — `.neq('status', …)` matches
  // only when this save genuinely CHANGES the decision — rather than in a
  // read-then-write that two concurrent reviewers could both pass.
  let changedRow = null;
  if (body.status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('abstracts')
      .update({ ...patch, status: body.status })
      .eq('id', body.abstractId)
      .eq('event_id', params.id)
      .neq('status', body.status)
      .select(SELECT)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    changedRow = data;
  }

  // No status supplied, or the status was already what was asked for — save the
  // rest (notes, session assignment) without re-notifying anyone.
  let abstract = changedRow;
  if (!abstract) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('abstracts')
      .update(patch)
      .eq('id', body.abstractId)
      .eq('event_id', params.id)
      .select(SELECT)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Abstract not found' }, { status: 404 });
    abstract = data;
  }

  // Tell the author. Until now a decision was recorded on the organiser's
  // dashboard and nowhere else — the submitter, who has no account and no
  // /speaking entry until they are already a speaker, had no way to learn it,
  // while three separate strings in the UI promised an email.
  //
  // AWAITED: on serverless the response ends the invocation, so a floating
  // promise here would be dropped.
  if (body.status && changedRow && NOTIFIED.includes(body.status)) {
    const author = primaryAuthorOf(changedRow.authors_json);
    if (author) {
      await sendAbstractDecisionEmail({
        to: author.email,
        authorName: author.name,
        abstractTitle: changedRow.title,
        eventName: event.name,
        decision: body.status as Exclude<AbstractStatus, 'pending'>,
        notes: changedRow.review_notes,
      }).catch(() => {/* best-effort; the decision is already saved */});
    }
  }

  return NextResponse.json({ abstract });
}
