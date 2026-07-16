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
  wordmarkHtml: string;   // rendered inside the header when NOT the default brand
  isDefault: boolean;     // true = show the real Eventera logo image instead of wordmarkHtml
  primary: string;        // header + primary CTA color
  from: string;           // "Name <email>"
  replyTo?: string;
}

const APP_URL_BASE = process.env.NEXT_PUBLIC_APP_URL ?? '';
const LOGO_WHITE_URL = `${APP_URL_BASE}/eventera-logo-white.png`;
const LOGO_COLOR_URL = `${APP_URL_BASE}/eventera-logo.png`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Resolve the sender/branding for an attendee email. Defaults to Eventera;
 * overridden by the event owner's white-label settings when on Studio.
 */
async function resolveBrand(eventId?: string): Promise<EmailBrand> {
  let wordmarkHtml = '';
  let isDefault = true;
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
          isDefault = false;
        }
        if (wl.primaryColor) primary = wl.primaryColor;
        if (wl.fromName) fromName = wl.fromName;
        if (wl.replyToEmail) replyTo = wl.replyToEmail;
      }
    } catch {
      // fall back to Eventera defaults on any lookup failure
    }
  }

  return { wordmarkHtml, isDefault, primary, from: `${fromName} <${FROM_EMAIL}>`, replyTo };
}

function emailHeader(brand: EmailBrand, subtitle?: string): string {
  // Real logo image for the default Eventera brand; a plain text wordmark for
  // a Studio organizer's white-label brand name (no logo image on file for
  // an arbitrary custom brand, so text is the honest fallback there).
  const mark = brand.isDefault
    ? `<img src="${LOGO_WHITE_URL}" alt="Eventera" width="126" height="26" style="display:inline-block;height:26px;width:auto;border:0" />`
    : `<div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:22px;font-weight:600;color:white;letter-spacing:-0.01em;">${brand.wordmarkHtml}</div>`;
  return `<div style="background:${brand.isDefault ? 'linear-gradient(135deg,#1F4D3A 0%,#2A6A50 60%,#E8C57E 130%)' : brand.primary};border-radius:12px;padding:28px 28px 22px;text-align:center;margin-bottom:24px;">
      ${mark}
      ${subtitle ? `<p style="color:rgba(255,255,255,0.85);font-size:14px;margin:10px 0 0;font-family:Inter,system-ui,sans-serif;">${subtitle}</p>` : ''}
    </div>`;
}

// Consistent sign-off on every attendee email — the real logo mark (muted,
// since it sits on the light cream body background) plus a link back to
// eventera.so. White-label emails skip the Eventera mark (it's a Studio
// organizer's own brand voice at that point) but keep the same spacing.
function emailFooter(brand: EmailBrand): string {
  const mark = brand.isDefault
    ? `<img src="${LOGO_COLOR_URL}" alt="" width="70" height="14" style="display:inline-block;height:14px;width:auto;opacity:0.45;margin-bottom:8px;" /><br>`
    : '';
  return `<div style="text-align:center;padding:18px 0 4px;">
      ${mark}
      <p style="margin:0;font-size:11px;line-height:1.6;color:#9BA8A1;font-family:Inter,system-ui,sans-serif;">
        Powered by <a href="${APP_URL_BASE}" style="color:#65736B;text-decoration:underline;">Eventera</a> — personalized cards for every attendee.
      </p>
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
  coverImageUrl?: string | null;
  organizerName?: string | null;
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  await send(brand, {
    to: params.to,
    subject: `Reminder: ${params.eventTitle} is tomorrow`,
    html: buildReminderHtml(params, appUrl, brand),
  });
}

function buildConfirmationHtml(p: RegistrationConfirmEmailParams, appUrl: string, brand: EmailBrand) {
  const eventTitle = escapeHtml(p.eventTitle);
  const attendeeName = escapeHtml(p.attendeeName);
  const eventDate = escapeHtml(p.eventDate);
  const eventVenue = escapeHtml(p.eventVenue);
  const ticketType = escapeHtml(p.ticketType);
  const organizerName = p.organizerName ? escapeHtml(p.organizerName) : null;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">
    You're confirmed for ${eventTitle} · ${eventDate} · Your ticket and QR are inside.
  </div>
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand, "You're registered!")}

    ${p.coverImageUrl ? `
    <div style="border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <img src="${p.coverImageUrl}" alt="${eventTitle}" width="560" style="display:block;width:100%;height:auto;max-height:220px;object-fit:cover;" />
    </div>
    ` : ''}

    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.02em;margin:0 0 8px;">
      See you at ${eventTitle}
    </h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 24px;line-height:1.6;">
      Hi ${attendeeName}, your spot is confirmed${organizerName ? ` — ${organizerName} can&apos;t wait to have you there` : ''}.
    </p>

    <div style="background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Event details</div>
      <div style="font-weight:600;font-size:16px;margin-bottom:6px;">${eventTitle}</div>
      <div style="font-size:14px;color:#3A4A42;margin-bottom:4px;">📅 ${eventDate}</div>
      <div style="font-size:14px;color:#3A4A42;margin-bottom:${organizerName ? '4px' : '12px'};">📍 ${eventVenue}</div>
      ${organizerName ? `<div style="font-size:14px;color:#3A4A42;margin-bottom:12px;">🎤 Hosted by ${organizerName}</div>` : ''}
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
      <a href="${p.eventeraCardUrl}" style="display:inline-block;background:${brand.primary};color:white;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:'Plus Jakarta Sans',Inter,sans-serif;">
        Download your card
      </a>
      <p style="font-size:12px;color:#65736B;margin:10px 0 0;">Share it on LinkedIn, Twitter, and WhatsApp</p>
    </div>
    ` : ''}

    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;margin-top:20px;">
      <a href="${appUrl}/e/${p.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;font-weight:600;">View event page →</a>
    </div>
    ${emailFooter(brand)}
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

    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:26px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">
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
    ${emailFooter(brand)}
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

    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:26px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">
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
    ${emailFooter(brand)}
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
    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Hi ${name},</h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 16px;">We received your registration for <strong>${eventTitle}</strong>. The organiser reviews applications manually — you&apos;ll hear back by email once a decision is made.</p>
    <div style="background:white;border:1px solid #E5E0D4;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Event</div>
      <div style="font-weight:600;">${eventTitle}</div>
      ${eventDate ? `<div style="font-size:14px;color:#3A4A42;margin-top:4px;">${eventDate}</div>` : ''}
    </div>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${params.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
    ${emailFooter(brand)}
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
    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Great news, ${name}!</h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 16px;">Your registration for <strong>${eventTitle}</strong> has been approved. Your spot is confirmed.</p>
    <div style="text-align:center;background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">Your check-in QR code</div>
      <img src="${params.qrCodeUrl}" alt="QR code" width="160" height="160" style="border-radius:8px;" />
      <p style="font-size:12px;color:#65736B;margin:10px 0 0;">Show this at the door</p>
    </div>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${params.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
    ${emailFooter(brand)}
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
    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Hi ${name},</h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 16px;">Thank you for applying to <strong>${eventTitle}</strong>. Unfortunately, the organiser wasn&apos;t able to offer you a spot this time.</p>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${params.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
    ${emailFooter(brand)}
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
    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:24px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Hi ${name},</h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 16px;">Someone transferred their ticket for <strong>${eventTitle}</strong> to you. Your spot is confirmed.</p>
    <div style="text-align:center;background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">Your check-in QR code</div>
      <img src="${params.qrCodeUrl}" alt="QR code" width="160" height="160" style="border-radius:8px;" />
    </div>
    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/e/${params.eventSlug}" style="font-size:13px;color:${brand.primary};text-decoration:none;">View event page →</a>
    </div>
    ${emailFooter(brand)}
  </div>
</body></html>`,
  });
}

function buildReminderHtml(p: RegistrationReminderEmailParams, appUrl: string, brand: EmailBrand) {
  const eventTitle = escapeHtml(p.eventTitle);
  const attendeeName = escapeHtml(p.attendeeName);
  const eventDate = escapeHtml(p.eventDate);
  const eventVenue = escapeHtml(p.eventVenue);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#FAF6EE;color:#0F1F18;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">
    ${eventTitle} is tomorrow — ${eventDate} · ${eventVenue}
  </div>
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${emailHeader(brand, 'See you tomorrow')}

    <h1 style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.02em;margin:0 0 8px;">
      ${eventTitle} is tomorrow
    </h1>
    <p style="font-size:15px;color:#3A4A42;margin:0 0 24px;line-height:1.6;">Hi ${attendeeName}, just a quick reminder — we&apos;ll see you there!</p>

    <div style="background:white;border:1px solid #E5E0D4;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-family:Inter,sans-serif;color:#65736B;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Event details</div>
      <div style="font-weight:600;font-size:16px;margin-bottom:6px;">${eventTitle}</div>
      <div style="font-size:14px;color:#3A4A42;margin-bottom:4px;">📅 ${eventDate}</div>
      <div style="font-size:14px;color:#3A4A42;">📍 ${eventVenue}</div>
    </div>

    <div style="text-align:center;padding:20px 0;border-top:1px solid #E5E0D4;">
      <a href="${appUrl}/my-tickets" style="font-size:13px;color:${brand.primary};text-decoration:none;font-weight:600;">View my ticket →</a>
    </div>
    ${emailFooter(brand)}
  </div>
</body>
</html>`;
}
