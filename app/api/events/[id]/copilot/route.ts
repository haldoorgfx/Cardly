import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { getEventOwnerPlan } from '@/lib/billing/can';
import { hasERA } from '@/lib/ai/gate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AI Copilot — real Claude-backed event assistant.
 * Verifies the caller owns the event, gathers live event context (details +
 * registration stats), and streams Claude's reply back as plain text.
 */

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(40),
});

// Keys we surface to the model when present on the event row — kept to an
// allowlist so unknown/sensitive columns never leak into the prompt.
const EVENT_CONTEXT_KEYS = [
  'name', 'status', 'slug', 'description', 'category',
  'starts_at', 'start_date', 'ends_at', 'end_date', 'timezone',
  'venue', 'venue_name', 'location', 'address', 'city', 'country',
  'is_paid', 'currency', 'capacity', 'max_attendees',
];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI is not configured on this deployment.' }, { status: 503 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', params.id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Plan gate. Copilot is the single most expensive endpoint in the product —
  // a frontier model with a 40-turn history — and it was the ONLY AI surface
  // with no plan check at all, so any free signup could run it without limit.
  // CLAUDE.md is explicit that AI is locked on Free, so this matches the
  // documented policy and every /api/era route.
  //
  // Gated on the EVENT OWNER's plan, not the caller's: a Studio organiser's
  // teammates reach this event through manageableOwnerIds() above and must not
  // be told to upgrade their own personal account to use the owner's feature.
  const ownerPlan = await getEventOwnerPlan(params.id);
  if (!ownerPlan || !hasERA(ownerPlan)) {
    return NextResponse.json(
      { error: 'AI Copilot is a paid feature. Upgrade to Pro to use it.' },
      { status: 402 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Live registration stats for grounding the model's answers.
  const [{ count: totalRegs }, { count: confirmed }, { count: checkedIn }, { count: waitlisted }] =
    await Promise.all([
      // "Registered" = confirmed + checked_in everywhere in the product, so
      // ground the model on that same set — quoting a raw all-status total made
      // Copilot state a higher number than the Overview/Analytics headline.
      adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', params.id).in('status', ['confirmed', 'checked_in']),
      adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', params.id).in('status', ['confirmed', 'checked_in']),
      adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', params.id).eq('status', 'checked_in'),
      adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', params.id).eq('status', 'waitlisted'),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventRow = event as Record<string, any>;
  const eventContext: Record<string, unknown> = {};
  for (const key of EVENT_CONTEXT_KEYS) {
    if (eventRow[key] !== undefined && eventRow[key] !== null && eventRow[key] !== '') {
      eventContext[key] = eventRow[key];
    }
  }

  const stats = {
    total_registrations: totalRegs ?? 0,
    confirmed: confirmed ?? 0,
    checked_in: checkedIn ?? 0,
    waitlisted: waitlisted ?? 0,
    check_in_rate_pct: (confirmed ?? 0) > 0 ? Math.round(((checkedIn ?? 0) / (confirmed ?? 1)) * 100) : 0,
  };

  const system = [
    "You are Eventera Copilot, an AI assistant embedded in the Eventera event-management platform.",
    "You help an event organizer manage their event: answering questions about registrations and check-in, drafting attendee emails and social posts, suggesting survey questions, and giving practical event-ops advice.",
    "",
    "Rules:",
    "- Ground every factual claim about THIS event in the data below. Never invent registration numbers, dates, or venues. If a detail isn't in the data, say so and ask for it (e.g. use a [TIME] / [VENUE] placeholder in drafts).",
    "- Be concise and direct. Use short paragraphs.",
    "- For formatting, use only plain text and **bold** for emphasis. Do not use headings, bullet-point markdown (`-`/`*`), tables, or code fences — they don't render here. For drafts (emails/posts), separate the draft from your message with a line containing only `---`.",
    "- When drafting, match a warm, professional event-host tone.",
    "",
    "Event data (JSON):",
    JSON.stringify({ event: eventContext, stats }, null, 2),
  ].join('\n');

  const anthropic = new Anthropic();

  // Tie the upstream call to the client's connection. Without a signal, an
  // organiser closing the tab or hitting stop mid-reply left Anthropic
  // generating the full 4000-token completion into a socket nobody was
  // reading — billed in full, every time. `cancel()` below covers the case
  // where the consumer goes away after the stream has already started.
  const aiStream = anthropic.messages.stream(
    {
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      system,
      messages: parsed.data.messages,
    },
    { signal: req.signal },
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of aiStream) {
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(ev.delta.text));
          }
        }
      } catch (err) {
        // An abort is the expected path when the client disconnects, not a
        // fault: there is no longer a reader to show a message to, and
        // enqueueing into a cancelled controller throws.
        if (req.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
          return;
        }
        // The 503 above only covers a MISSING key. A key that is invalid,
        // revoked, or over its quota fails here instead — mid-stream, after
        // headers are already sent, so it cannot become a status code. Keep the
        // provider's message server-side: Anthropic SDK errors can carry
        // request ids and key/account detail, and this string is rendered
        // straight into the organiser's chat transcript.
        console.error('[copilot] stream error:', err);
        try {
          controller.enqueue(
            encoder.encode('\n\n[Copilot could not finish this reply. Please try again.]'),
          );
        } catch { /* consumer already gone */ }
      } finally {
        // Both branches above can leave the controller already torn down by a
        // cancel(); closing twice throws and would surface as an unhandled
        // rejection in the function logs.
        try { controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() {
      // The reader went away (tab closed, navigation, client abort). Stop the
      // upstream generation rather than paying for tokens nobody receives.
      aiStream.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
