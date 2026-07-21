import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { wrap, esc } from '@/lib/email';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import {
  filterUnsubscribed,
  unsubscribeTableExists,
  unsubscribeUrl,
} from '@/lib/email/unsubscribe';

// RESEND_FROM_EMAIL is a BARE address; the display name comes from
// RESEND_FROM_NAME. Build `from` here so it never double-wraps.
const FROM = `${process.env.RESEND_FROM_NAME ?? 'Eventera'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@eventera.so'}>`;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null; // no-op if not configured — mirrors lib/email/index.ts
  return new Resend(key);
}

// POST — send a broadcast email to all confirmed/checked-in attendees
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  let { data: { user } } = await supabase.auth.getUser();

  // Mobile has no Next.js cookie session — it sends its Supabase JWT as a
  // Bearer header instead (see eventera_mobile/lib/net.dart's apiPost).
  // createClient() only ever reads cookies, so fall back to verifying that
  // token directly when there's no cookie session, exactly like the web
  // cookie path: an independent, equally-strong identity check, not a
  // weaker one.
  if (!user) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('id', params.id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { subject: string; message: string };
  const { subject, message } = body;
  if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
  if (!message?.trim()) return NextResponse.json({ error: 'Message body is required' }, { status: 400 });

  // Fetch all confirmed + checked-in attendees
  const { data: regs } = await admin
    .from('registrations')
    .select('attendee_name, attendee_email')
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'checked_in']);

  if (!regs || regs.length === 0) {
    return NextResponse.json({ error: 'No confirmed attendees to email' }, { status: 400 });
  }

  // Honour opt-outs. This is the only broadcast path in the product, so if a
  // suppressed address isn't removed here it isn't removed anywhere.
  //
  // `unsubscribeReady` gates the whole feature on the suppression table
  // existing (migration 102 is applied by hand, so the code ships first).
  // Until then we send exactly as before rather than advertising an opt-out we
  // couldn't record — a dead unsubscribe link is worse than none.
  const unsubscribeReady = await unsubscribeTableExists();
  const suppressed = unsubscribeReady
    ? await filterUnsubscribed(regs.map(r => r.attendee_email))
    : new Set<string>();

  const recipients = regs.filter(
    r => !suppressed.has((r.attendee_email ?? '').trim().toLowerCase()),
  );
  const skipped = regs.length - recipients.length;

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: 'Every confirmed attendee has unsubscribed from event updates', sent: 0, skipped },
      { status: 400 },
    );
  }

  const resend = getResend();
  if (!resend) {
    // Email isn't configured — don't crash; report zero sent.
    return NextResponse.json({ error: 'Email is not configured on this server', sent: 0 }, { status: 503 });
  }
  // Resend batch API — max 100 per call.
  // Track sent vs failed per-batch so a mid-loop failure returns partial success
  // (200 with { sent, failed }) instead of throwing a bodyless 500 that would
  // tempt the organizer to re-send and duplicate the blast.
  const BATCH = 100;
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH);
    try {
      const { error } = await resend.batch.send(
        chunk.map(r => {
          // Per-recipient, because the token is bound to their address.
          const unsub = unsubscribeReady ? unsubscribeUrl(r.attendee_email, params.id) : null;
          return {
            from: FROM,
            to: r.attendee_email,
            subject: subject.trim(),
            // Gmail and Yahoo have required List-Unsubscribe on bulk mail since
            // Feb 2024 — without it broadcasts land in spam regardless of
            // content. List-Unsubscribe-Post opts into RFC 8058 one-click, so
            // their native Unsubscribe button POSTs straight to us.
            ...(unsub
              ? {
                  headers: {
                    'List-Unsubscribe': `<${unsub}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                  },
                }
              : {}),
            html: buildBroadcastHtml({
              attendeeName: r.attendee_name ?? 'Attendee',
              eventName: event.name,
              subject: subject.trim(),
              message: message.trim(),
              unsubscribeUrl: unsub,
            }),
          };
        })
      );
      if (error) failed += chunk.length;
      else sent += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }

  return NextResponse.json({ sent, failed, skipped });
}

function buildBroadcastHtml({
  attendeeName, eventName, subject, message, unsubscribeUrl,
}: {
  attendeeName: string;
  eventName: string;
  subject: string;
  message: string;
  unsubscribeUrl?: string | null;
}) {
  // Preserve line breaks in the organizer's plain-text message.
  const messageHtml = esc(message).replace(/\n/g, '<br>');

  return wrap(`
    <p style="margin:0 0 4px;font-size:12px;color:#65736B;text-transform:uppercase;letter-spacing:0.08em;">Message from ${esc(eventName)}</p>
    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;margin:8px 0 16px;">${esc(subject)}</h1>
    <p style="font-size:14px;color:#65736B;margin:0 0 16px;">Hi ${esc(attendeeName)},</p>
    <div style="font-size:15px;color:#3A4A42;line-height:1.6;">${messageHtml}</div>
  `, {
    preheader: `${subject} — a message from ${eventName}`,
    unsubscribeUrl: unsubscribeUrl ?? undefined,
  });
}
