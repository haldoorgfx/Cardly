// Registration email triggers — Phase 1.5
// Uses existing Resend setup

import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@karta.cre8so.com';

export interface RegistrationConfirmEmailParams {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  qrCodeUrl: string;
  kartaCardUrl: string | null;
  eventSlug: string;
  ticketType: string;
}

export async function sendRegistrationConfirmEmail(params: RegistrationConfirmEmailParams) {
  const resend = getResend();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';

  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `You're registered for ${params.eventTitle}`,
    html: buildConfirmationHtml(params, appUrl),
  });
}

export interface RegistrationReminderEmailParams {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventSlug: string;
}

export async function sendRegistrationReminderEmail(params: RegistrationReminderEmailParams) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Reminder: ${params.eventTitle} is tomorrow`,
    html: buildReminderHtml(params),
  });
}

function buildConfirmationHtml(p: RegistrationConfirmEmailParams, appUrl: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#1F4D3A;border-radius:12px;padding:28px 28px 20px;text-align:center;margin-bottom:24px;">
      <div style="font-family:'DM Sans',system-ui,sans-serif;font-size:22px;font-weight:600;color:white;letter-spacing:-0.01em;">
        Kart<span style="color:#E8C57E;">a</span>
      </div>
      <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:8px 0 0;">You&apos;re registered!</p>
    </div>

    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:26px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">
      See you at ${p.eventTitle}
    </h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 24px;">Hi ${p.attendeeName}, your spot is confirmed.</p>

    <div style="background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:'JetBrains Mono',monospace;color:#6B7A72;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Event details</div>
      <div style="font-weight:600;font-size:16px;margin-bottom:6px;">${p.eventTitle}</div>
      <div style="font-size:14px;color:#3A4A42;margin-bottom:4px;">${p.eventDate}</div>
      <div style="font-size:14px;color:#3A4A42;margin-bottom:12px;">${p.eventVenue}</div>
      <div style="font-size:12px;font-family:'JetBrains Mono',monospace;color:#1F4D3A;background:#E8EFEB;padding:4px 10px;border-radius:4px;display:inline-block;">
        ${p.ticketType}
      </div>
    </div>

    ${p.qrCodeUrl ? `
    <div style="text-align:center;background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:'JetBrains Mono',monospace;color:#6B7A72;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Your check-in QR code</div>
      <img src="${p.qrCodeUrl}" alt="Check-in QR code" width="160" height="160" style="border-radius:8px;" />
      <p style="font-size:12px;color:#6B7A72;margin:10px 0 0;">Show this at the door</p>
    </div>
    ` : ''}

    ${p.kartaCardUrl ? `
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${p.kartaCardUrl}" style="display:inline-block;background:#1F4D3A;color:white;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Download your Karta Card
      </a>
      <p style="font-size:12px;color:#6B7A72;margin:10px 0 0;">Share it on LinkedIn, Twitter, and WhatsApp</p>
    </div>
    ` : ''}

    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;margin-top:20px;">
      <a href="${appUrl}/e/${p.eventSlug}" style="font-size:13px;color:#1F4D3A;text-decoration:none;">View event page →</a>
    </div>
  </div>
</body>
</html>`;
}

function buildReminderHtml(p: RegistrationReminderEmailParams) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;">
      ${p.eventTitle} is tomorrow
    </h1>
    <p style="font-size:15px;color:#3A4A42;">Hi ${p.attendeeName}, just a quick reminder!</p>
    <p style="font-size:14px;color:#3A4A42;">${p.eventDate} · ${p.eventVenue}</p>
  </div>
</body>
</html>`;
}
