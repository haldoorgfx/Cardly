import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/newsletter  { email, source? }
 *
 * Stores a marketing-newsletter signup. Durable source of truth is the
 * `newsletter_subscribers` table (migration 057). If RESEND_API_KEY and
 * RESEND_AUDIENCE_ID are both set, the contact is ALSO added to the Resend
 * Audience — but that is best-effort and never blocks or fails the request.
 *
 * The route always succeeds on a valid email, even with no Resend configured.
 */

const bodySchema = z.object({
  email: z.string().email().max(254).transform((v) => v.toLowerCase().trim()),
  source: z.string().max(60).optional(),
});

/** Best-effort add to a Resend Audience. Never throws. */
async function addToResendAudience(email: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audienceId) return; // not configured — skip silently

  await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  }).catch(() => {}); // fire-and-forget — never crash the caller
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' },
      { status: 400 },
    );
  }

  const { email, source } = parsed.data;

  // Store durably. Idempotent on lower(email) via the unique index in 057.
  try {
    const supabase = createAdminClient();
    // email is pre-lowercased, so the lower(email) unique index catches dups.
    // types/database.ts does not know this table yet, so we cast the client.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('newsletter_subscribers')
      .insert({ email, source: source ?? 'marketing' });

    // A duplicate (23505) is a success from the user's point of view. Any
    // other DB error is logged but we still return success so the form never
    // appears broken to a visitor — the email may still have reached Resend.
    if (error && error.code !== '23505') {
      console.error('[newsletter] store failed:', error.message);
    }
  } catch (err) {
    console.error('[newsletter] unexpected store error:', err);
  }

  // Best-effort Resend Audience subscribe (no-op if unconfigured).
  await addToResendAudience(email);

  return NextResponse.json({ ok: true });
}
