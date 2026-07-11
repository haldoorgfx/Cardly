import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@eventera.so';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

// POST — send a broadcast email to all confirmed/checked-in attendees
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('id', params.id)
    .eq('user_id', user.id)
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

  const resend = getResend();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  // Resend batch API — max 100 per call
  const BATCH = 100;
  let sent = 0;
  for (let i = 0; i < regs.length; i += BATCH) {
    const chunk = regs.slice(i, i + BATCH);
    await resend.batch.send(
      chunk.map(r => ({
        from: FROM,
        to: r.attendee_email,
        subject: subject.trim(),
        html: buildBroadcastHtml({
          attendeeName: r.attendee_name ?? 'Attendee',
          eventName: event.name,
          subject: subject.trim(),
          message: message.trim(),
          appUrl,
        }),
      }))
    );
    sent += chunk.length;
  }

  return NextResponse.json({ sent });
}

function buildBroadcastHtml({
  attendeeName, eventName, subject, message, appUrl,
}: {
  attendeeName: string;
  eventName: string;
  subject: string;
  message: string;
  appUrl: string;
}) {
  // Preserve line breaks in message
  const messageHtml = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#1F4D3A;border-radius:12px;padding:24px 28px;margin-bottom:24px;">
      <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:18px;font-weight:600;color:white;">
        Eventer<span style="color:#E8C57E;">a</span>
      </div>
      <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:6px 0 0;">Message from ${eventName}</p>
    </div>

    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;margin:0 0 16px;">${subject}</h1>
    <p style="font-size:14px;color:#6B7A72;margin:0 0 16px;">Hi ${attendeeName},</p>
    <div style="font-size:15px;color:#3A4A42;line-height:1.6;margin-bottom:28px;">${messageHtml}</div>

    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <p style="font-size:12px;color:#9BA8A1;margin:0;">
        You received this because you registered for ${eventName}.<br>
        Powered by <a href="${appUrl}" style="color:#1F4D3A;text-decoration:none;">Eventera</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
