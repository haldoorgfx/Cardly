/**
 * Server-authoritative broadcast dispatch.
 *
 * The client NEVER supplies a recipient list. It sends an audience spec; the
 * server resolves the real registrations, gates every recipient through
 * isNotifAllowed (opt-out model), and dispatches over the channels that are
 * genuinely configured.
 *
 *   • email  → Resend REST (real send when RESEND_API_KEY is set)
 *   • inapp  → notifications table via createNotification (real)
 *   • whatsapp / sms → no provider binding on this deployment → recorded as
 *     skipped. We never pretend to send.
 */

import { isNotifAllowed } from '@/lib/notifications/prefs';
import { createNotification } from '@/lib/notifications';
import { emailProviderConfigured } from '@/lib/notifications/channels';

export type AudienceKind = 'all' | 'checked_in' | 'ticket_type';

export interface AudienceSpec {
  kind: AudienceKind;
  ticketTypeId?: string | null;
}

export interface Recipient {
  name: string;
  email: string;
  phone: string | null;
  profileId: string | null;
}

export interface ChannelResult {
  sent: number;
  skipped: number;
  failed: number;
}

export interface DispatchResult {
  email: ChannelResult;
  inapp: ChannelResult;
  whatsapp: ChannelResult;
  sms: ChannelResult;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Eventera <noreply@karta.cre8so.com>';

function zero(): ChannelResult {
  return { sent: 0, skipped: 0, failed: 0 };
}

/** Resolve the real recipient set for an audience spec. Server-side only. */
export async function resolveAudience(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  eventId: string,
  spec: AudienceSpec,
): Promise<Recipient[]> {
  let q = admin
    .from('registrations')
    .select('attendee_name, attendee_email, attendee_phone, status, ticket_type_id')
    .eq('event_id', eventId);

  if (spec.kind === 'checked_in') q = q.eq('status', 'checked_in');
  else q = q.in('status', ['confirmed', 'checked_in']);

  if (spec.kind === 'ticket_type' && spec.ticketTypeId) q = q.eq('ticket_type_id', spec.ticketTypeId);

  const { data } = await q;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];

  // Map attendee emails → Eventera profile ids (for opt-out gating + in-app).
  const emails = Array.from(
    new Set(rows.map((r) => String(r.attendee_email ?? '').toLowerCase()).filter(Boolean)),
  );
  const profileByEmail = new Map<string, string>();
  if (emails.length > 0) {
    const { data: profs } = await admin.from('profiles').select('id, email').in('email', emails);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((profs ?? []) as any[]).forEach((p) => {
      if (p.email) profileByEmail.set(String(p.email).toLowerCase(), p.id as string);
    });
  }

  // Dedup by email so a person is contacted once.
  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  rows.forEach((r) => {
    const email = String(r.attendee_email ?? '').trim();
    const key = email.toLowerCase();
    if (!email || seen.has(key)) return;
    seen.add(key);
    recipients.push({
      name: r.attendee_name ?? 'Attendee',
      email,
      phone: r.attendee_phone ?? null,
      profileId: profileByEmail.get(key) ?? null,
    });
  });
  return recipients;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function broadcastHtml(name: string, eventName: string, subject: string, body: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const msg = escapeHtml(body).replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:linear-gradient(135deg,#1F4D3A,#2A6A50);border-radius:12px;padding:24px 28px;margin-bottom:24px;">
      <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:18px;font-weight:600;color:#FFFFFF;">Eventer<span style="color:#E8C57E;">a</span></div>
      <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:6px 0 0;">Message from ${escapeHtml(eventName)}</p>
    </div>
    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;margin:0 0 16px;">${escapeHtml(subject)}</h1>
    <p style="font-size:14px;color:#6B7A72;margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <div style="font-size:15px;color:#3A4A42;line-height:1.6;margin-bottom:28px;">${msg}</div>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <p style="font-size:12px;color:#6B7A72;margin:0;">You received this because you registered for ${escapeHtml(eventName)}.<br>
      Powered by <a href="${appUrl}" style="color:#1F4D3A;text-decoration:none;">Eventera</a></p>
    </div>
  </div>
</body></html>`;
}

async function sendOneEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Dispatch a broadcast over the selected channels, respecting isNotifAllowed for
 * every recipient. WhatsApp/SMS are recorded as skipped — there is no provider
 * binding on this deployment, and we do not fake a send.
 */
export async function dispatchBroadcast(params: {
  eventId: string;
  eventName: string;
  subject: string;
  body: string;
  recipients: Recipient[];
  channels: { email: boolean; inapp: boolean; whatsapp: boolean; sms: boolean };
}): Promise<DispatchResult> {
  const { eventId, eventName, subject, body, recipients, channels } = params;
  const result: DispatchResult = { email: zero(), inapp: zero(), whatsapp: zero(), sms: zero() };
  const emailReady = channels.email && emailProviderConfigured();
  const subj = subject.trim() || `Update from ${eventName}`;

  for (const r of recipients) {
    if (channels.email) {
      if (!emailReady) {
        result.email.skipped += 1;
      } else if (!(await isNotifAllowed(r.profileId ?? '', 'reminders', 'email'))) {
        result.email.skipped += 1;
      } else {
        const ok = await sendOneEmail(r.email, subj, broadcastHtml(r.name, eventName, subj, body));
        if (ok) result.email.sent += 1;
        else result.email.failed += 1;
      }
    }

    if (channels.inapp) {
      if (!r.profileId) {
        result.inapp.skipped += 1; // no Eventera account to notify
      } else if (!(await isNotifAllowed(r.profileId, 'reminders', 'inapp'))) {
        result.inapp.skipped += 1;
      } else {
        await createNotification({
          userId: r.profileId,
          eventId,
          type: 'event_update',
          title: subj,
          body,
        });
        result.inapp.sent += 1;
      }
    }

    // WhatsApp & SMS: no live provider binding on this deployment. We persist the
    // intent (the broadcasts row records the channel) but never pretend to send.
    if (channels.whatsapp) result.whatsapp.skipped += 1;
    if (channels.sms) result.sms.skipped += 1;
  }

  return result;
}
