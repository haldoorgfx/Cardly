// Registration email triggers — Phase 1.5
// Uses existing Resend setup. Attendee-facing emails honour the organizer's
// white-label branding (Studio plan) when an `eventId` is supplied.

import { Resend } from 'resend';
import { getWhiteLabelByEvent } from '@/lib/white-label/server';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null; // no-op if not configured — mirrors lib/email/index.ts
  return new Resend(key);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@eventera.so';

// ── White-label branding ───────────────────────────────────────────────────────

interface EmailBrand {
  wordmarkHtml: string;   // rendered inside the header
  primary: string;        // header + primary CTA color
  from: string;           // "Name <email>"
  replyTo?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Resolve the sender/branding for an attendee email. Defaults to Eventera;
 * overridden by the event owner's white-label settings when on Studio.
 */
async function resolveBrand(eventId?: string): Promise<EmailBrand> {
  let wordmarkHtml = `Eventer<span style="color:#E8C57E;">a</span>`;
  let primary = '#1F4D3A';
  let fromName = process.env.RESEND_FROM_NAME ?? 'Eventera';
  let replyTo: string | undefined;

  if (eventId) {
    try {
      const wl = await getWhiteLabelByEvent(eventId);
      if (wl) {
        if (wl.brandName) {
          wordmarkHtml = escapeHtml(wl.brandName);
          fromName = wl.brandName;
        }
        if (wl.primaryColor) primary = wl.primaryColor;
        if (wl.fromName) fromName = wl.fromName;
        if (wl.replyToEmail) replyTo = wl.replyToEmail;
      }
    } catch {
      // fall back to Eventera defaults on any lookup failure
    }
  }

  return { wordmarkHtml, primary, from: `${fromName} <${FROM_EMAIL}>`, replyTo };
}

function emailHeader(brand: EmailBrand, subtitle?: string): string {
  return `<div style="background:${brand.primary};border-radius:12px;padding:28px 28px 20px;text-align:center;margin-bottom:24px;">
      <div style="font-family:'DM Sans',system-ui,sans-serif;font-size:22px;font-weight:600;color:white;letter-spacing:-0.01em;">
        ${brand.wordmarkHtml}
      </div>
      ${subtitle ? `<p style="color:rgba(255,255,255,0.75);font-size:14px;margin:8px 0 0;">${subtitle}</p>` : ''}
    </div>`;
}

async function send(brand: EmailBrand, opts: { to: string; subject: string; html: string }) {
  const resend = getResend();
  if (!resend) return; // gracefully no-op when RESEND_API_KEY is missing
  await resend.emails.send({
    from: brand.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(brand.replyTo ? { replyTo: brand.replyTo } : {}),
  });
}

// ── Registration confirmation ──────────────────────────────────────────────────

export interface RegistrationConfirmEmailParams {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  qrCodeUrl: string;
  eventeraCardUrl: string | null;
  eventSlug: string;
  ticketType: string;
  eventId?: string;
}

export async function sendRegistrationConfirmEmail(params: RegistrationConfirmEmailParams) {
  const brand = await resolveBrand(params.eventId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  await send(brand, {
    to: params.to,
    subject: `You're registered for ${params.eventTitle}`,
    html: buildConfirmationHtml(params, appUrl, brand),
  });
}

export interface RegistrationReminderEmailParams {
  to: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventSlug: string;
  eventId?: string;
}

export async function sendRegistrationReminderEmail(params: RegistrationReminderEmailParams) {
  const brand = await resolveBrand(params.eventId);
  await send(brand, {
    to: params.to,
    subject: `Reminder: ${params.eventTitle} is tomorrow`,
    html: buildReminderHtml(params),
  });
}

function buildConfirmationHtml(p: RegistrationConfirmEmailParams, appUrl: string, brand: EmailBrand) {
  const eventTitle = escapeHtml(p.eventTitle);
  const attendeeName = escapeHtml(p.attendeeName);
  const eventDate = escapeHtml(p.eventDate);
  const eventVenue = escapeHtml(p.eventVenue);
  const ticketType = escapeHtml(p.ticketType);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand, "You're registered!")}

    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:26px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">
      See you at ${eventTitle}
    </h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 24px;">Hi ${attendeeName}, your spot is confirmed.</p>

    <div style="background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Event details</div>
      <div style="font-weight:600;font-size:16px;margin-bottom:6px;">${eventTitle}</div>
      <div style="font-size:14px;color:#3A4A42;margin-bottom:4px;">${eventDate}</div>
      <div style="font-size:14px;color:#3A4A42;margin-bottom:12px;">${eventVenue}</div>
      <div style="font-size:12px;font-family:Inter,sans-serif;color:${brand.primary};background:#E8EFEB;padding:4px 10px;border-radius:4px;display:inline-block;">
        ${ticketType}
      </div>
    </div>

    ${p.qrCodeUrl ? `
    <div style="text-align:center;background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Your check-in QR code</div>
      <img src="${p.qrCodeUrl}" alt="Check-in QR code" width="160" height="160" style="border-radius:8px;" />
      <p style="font-size:12px;color:#65736B;margin:10px 0 0;">Show this at the door</p>
    </div>
    ` : ''}

    ${p.eventeraCardUrl ? `
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${p.eventeraCardUrl}" style="display:inline-block;background:${brand.primary};color:white;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Download your card
      </a>
      <p style="font-size:12px;color:#65736B;margin:10px 0 0;">Share it on LinkedIn, Twitter, and WhatsApp</p>
    </div>
    ` : ''}

    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;margin-top:20px;">
      <a href="${appUrl}/e/${p.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
  </div>
</body>
</html>`;
}

// ── Waitlist join confirmation ─────────────────────────────────────────────────

export interface WaitlistConfirmEmailParams {
  to: string;
  name: string;
  position: number;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  city: string | null;
  eventId?: string;
}

export async function sendWaitlistConfirmEmail(params: WaitlistConfirmEmailParams) {
  const brand = await resolveBrand(params.eventId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  await send(brand, {
    to: params.to,
    subject: `You're #${params.position} on the waitlist for ${params.eventTitle}`,
    html: buildWaitlistConfirmHtml(params, appUrl, brand),
  });
}

// ── Waitlist invite ────────────────────────────────────────────────────────────

export interface WaitlistInviteEmailParams {
  to: string;
  name: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  eventId?: string;
}

export async function sendWaitlistInviteEmail(params: WaitlistInviteEmailParams) {
  const brand = await resolveBrand(params.eventId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  await send(brand, {
    to: params.to,
    subject: `A spot opened up — register now for ${params.eventTitle}`,
    html: buildWaitlistInviteHtml(params, appUrl, brand),
  });
}

function buildWaitlistConfirmHtml(p: WaitlistConfirmEmailParams, appUrl: string, brand: EmailBrand) {
  const eventTitle = escapeHtml(p.eventTitle);
  const name = escapeHtml(p.name);
  const eventDate = escapeHtml(p.eventDate);
  const city = p.city ? escapeHtml(p.city) : null;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand, "You're on the waitlist")}

    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:26px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">
      You&apos;re #<span style="color:#E8C57E;font-family:Inter,sans-serif;">${p.position}</span> in line
    </h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 24px;">Hi ${name}, we&apos;ve added you to the waitlist for ${eventTitle}.</p>

    <div style="background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Event details</div>
      <div style="font-weight:600;font-size:16px;margin-bottom:6px;">${eventTitle}</div>
      ${eventDate ? `<div style="font-size:14px;color:#3A4A42;margin-bottom:4px;">${eventDate}</div>` : ''}
      ${city ? `<div style="font-size:14px;color:#3A4A42;">${city}</div>` : ''}
    </div>

    <p style="font-size:14px;color:#65736B;text-align:center;margin:0 0 20px;">
      We&apos;ll email you immediately if a spot opens up. No action needed.
    </p>

    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${p.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
  </div>
</body>
</html>`;
}

function buildWaitlistInviteHtml(p: WaitlistInviteEmailParams, appUrl: string, brand: EmailBrand) {
  const eventTitle = escapeHtml(p.eventTitle);
  const name = escapeHtml(p.name);
  const eventDate = escapeHtml(p.eventDate);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand, 'A spot opened up!')}

    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:26px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">
      Good news, ${name}
    </h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 24px;">A spot just opened for <strong>${eventTitle}</strong>. You&apos;re invited to register — act fast, this may not last long.</p>

    <div style="background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Event</div>
      <div style="font-weight:600;font-size:16px;margin-bottom:6px;">${eventTitle}</div>
      ${eventDate ? `<div style="font-size:14px;color:#3A4A42;">${eventDate}</div>` : ''}
    </div>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="${appUrl}/e/${p.eventSlug}/register" style="display:inline-block;background:${brand.primary};color:white;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Register now →
      </a>
    </div>

    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${p.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
  </div>
</body>
</html>`;
}

// ── Approval flow emails ───────────────────────────────────────────────────────

export interface ApprovalEmailParams {
  to: string;
  name: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  eventId?: string;
}

export async function sendPendingApprovalEmail(params: ApprovalEmailParams) {
  const brand = await resolveBrand(params.eventId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const eventTitle = escapeHtml(params.eventTitle);
  const name = escapeHtml(params.name);
  const eventDate = escapeHtml(params.eventDate);
  await send(brand, {
    to: params.to,
    subject: `Your registration for ${params.eventTitle} is pending approval`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand, 'Registration received')}
    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Hi ${name},</h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 16px;">We received your registration for <strong>${eventTitle}</strong>. The organiser reviews applications manually — you&apos;ll hear back by email once a decision is made.</p>
    <div style="background:white;border:1px solid #E5E0D4;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Event</div>
      <div style="font-weight:600;">${eventTitle}</div>
      ${eventDate ? `<div style="font-size:14px;color:#3A4A42;margin-top:4px;">${eventDate}</div>` : ''}
    </div>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${params.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
  </div>
</body></html>`,
  });
}

export async function sendApprovedEmail(params: ApprovalEmailParams & { qrCodeUrl: string }) {
  const brand = await resolveBrand(params.eventId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const eventTitle = escapeHtml(params.eventTitle);
  const name = escapeHtml(params.name);
  await send(brand, {
    to: params.to,
    subject: `You're approved — see you at ${params.eventTitle}!`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand, "You're approved!")}
    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Great news, ${name}!</h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 16px;">Your registration for <strong>${eventTitle}</strong> has been approved. Your spot is confirmed.</p>
    <div style="text-align:center;background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">Your check-in QR code</div>
      <img src="${params.qrCodeUrl}" alt="QR code" width="160" height="160" style="border-radius:8px;" />
      <p style="font-size:12px;color:#65736B;margin:10px 0 0;">Show this at the door</p>
    </div>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${params.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
  </div>
</body></html>`,
  });
}

export async function sendDeniedEmail(params: ApprovalEmailParams) {
  const brand = await resolveBrand(params.eventId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const eventTitle = escapeHtml(params.eventTitle);
  const name = escapeHtml(params.name);
  await send(brand, {
    to: params.to,
    subject: `Update on your registration for ${params.eventTitle}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand)}
    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Hi ${name},</h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 16px;">Thank you for applying to <strong>${eventTitle}</strong>. Unfortunately, the organiser wasn&apos;t able to offer you a spot this time.</p>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${params.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
  </div>
</body></html>`,
  });
}

// ── Transfer confirmation ──────────────────────────────────────────────────────

export async function sendTransferEmail(params: { to: string; name: string; eventTitle: string; eventSlug: string; qrCodeUrl: string; eventId?: string }) {
  const brand = await resolveBrand(params.eventId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const eventTitle = escapeHtml(params.eventTitle);
  const name = escapeHtml(params.name);
  await send(brand, {
    to: params.to,
    subject: `You've received a ticket for ${params.eventTitle}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand, 'Ticket transferred to you')}
    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Hi ${name},</h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 16px;">Someone transferred their ticket for <strong>${eventTitle}</strong> to you. Your spot is confirmed.</p>
    <div style="text-align:center;background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">Your check-in QR code</div>
      <img src="${params.qrCodeUrl}" alt="QR code" width="160" height="160" style="border-radius:8px;" />
    </div>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${params.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
  </div>
</body></html>`,
  });
}

function buildReminderHtml(p: RegistrationReminderEmailParams) {
  const eventTitle = escapeHtml(p.eventTitle);
  const attendeeName = escapeHtml(p.attendeeName);
  const eventDate = escapeHtml(p.eventDate);
  const eventVenue = escapeHtml(p.eventVenue);
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <h1 style="font-family:'DM Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;">
      ${eventTitle} is tomorrow
    </h1>
    <p style="font-size:15px;color:#3A4A42;">Hi ${attendeeName}, just a quick reminder!</p>
    <p style="font-size:14px;color:#3A4A42;">${eventDate} · ${eventVenue}</p>
  </div>
</body>
</html>`;
}
