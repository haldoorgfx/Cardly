/**
 * Email sending via Resend REST API (no npm package — pure fetch).
 * Set RESEND_API_KEY in .env.local.
 *
 * If RESEND_API_KEY is missing the functions return silently — no crash.
 */

// RESEND_FROM_EMAIL is always a BARE address (e.g. noreply@eventera.so).
// The display name comes from RESEND_FROM_NAME. Building `from` here keeps the
// three email modules consistent and avoids a double-wrapped "Name <Name <…>>".
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@eventera.so';
const FROM_NAME = process.env.RESEND_FROM_NAME ?? 'Eventera';
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;
const BASE_URL = 'https://api.resend.com/emails';

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // no-op if not configured

  await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  }).catch(() => {}); // fire-and-forget — never crash the caller
}

// ─── Shared HTML shell ────────────────────────────────────────────────────────

const APP_URL_BASE = process.env.NEXT_PUBLIC_APP_URL ?? '';
// The real brand marks, not a CSS-styled text wordmark — served from /public,
// so they're stable absolute URLs any email client can load. Two variants
// because email-client CSS support for filters/blend-modes is too spotty to
// rely on recoloring one image — white-on-green for the header, the
// standard forest-on-transparent mark for the light cream footer.
const LOGO_WHITE_URL = `${APP_URL_BASE}/eventera-logo-white.png`;
const LOGO_COLOR_URL = `${APP_URL_BASE}/eventera-logo.png`;

export function wrap(
  content: string,
  opts?: { preheader?: string; unsubscribeUrl?: string },
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#FAF6EE;font-family:Inter,'Helvetica Neue',Arial,sans-serif;color:#0F1F18">
${opts?.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(opts.preheader)}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6EE;padding:40px 16px">
<tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#1F4D3A 0%,#2A6A50 60%,#E8C57E 130%);border-radius:16px 16px 0 0;padding:26px 32px">
      <img src="${LOGO_WHITE_URL}" alt="Eventera" width="126" height="26" style="display:block;height:26px;width:auto;border:0" />
    </td></tr>
    <!-- Body -->
    <tr><td style="background:#FFFFFF;padding:32px;border:1px solid #E5E0D4;border-top:none;border-bottom:none">
      ${content}
    </td></tr>
    <!-- Footer -->
    <tr><td style="background:#FAF6EE;padding:24px 32px;border:1px solid #E5E0D4;border-top:none;border-radius:0 0 16px 16px;text-align:center">
      <img src="${LOGO_COLOR_URL}" alt="" width="70" height="14" style="display:inline-block;height:14px;width:auto;opacity:0.5;margin-bottom:10px" />
      <p style="margin:0;font-size:11px;line-height:1.6;color:#65736B">
        ${opts?.unsubscribeUrl
          // Broadcast recipients are attendees, and most have no Eventera
          // account — the default line below ("notifications enabled in your
          // Eventera account") is simply untrue for them, and its Manage
          // preferences link lands them on a page they can't use. When an
          // unsubscribe URL is supplied, say the accurate thing and give them
          // a link that actually works.
          ? `You&apos;re receiving this because you registered for this event.<br>
        <a href="${opts.unsubscribeUrl}" style="color:#1F4D3A;text-decoration:underline">Unsubscribe</a>`
          : `You&apos;re receiving this because you have email notifications enabled in your Eventera account.<br>
        <a href="${APP_URL_BASE}/settings" style="color:#1F4D3A;text-decoration:underline">Manage preferences</a>`}
        &nbsp;·&nbsp;
        <a href="${APP_URL_BASE}" style="color:#1F4D3A;text-decoration:underline">eventera.so</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

function btn(href: string, text: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 26px;background:#1F4D3A;color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;font-family:'Plus Jakarta Sans',Inter,Arial,sans-serif">${text}</a>`;
}

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Generic notification email ───────────────────────────────────────────────

/** Mirrors any in-app notification into the user's inbox, so important updates
 *  reach them even when the app is closed. Channel/pref gating is the caller's
 *  job (see lib/notifications.ts `notify`). No-ops without RESEND_API_KEY. */
export async function sendNotificationEmail(opts: {
  to: string;
  title: string;
  body?: string;
  actionUrl?: string;
  actionLabel?: string;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const href = opts.actionUrl
    ? opts.actionUrl.startsWith('http')
      ? opts.actionUrl
      : `${appUrl}${opts.actionUrl}`
    : appUrl;
  const html = wrap(`
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0F1F18">${esc(opts.title)}</h1>
    ${opts.body ? `<p style="margin:0;font-size:14px;line-height:1.6;color:#3A4A42">${esc(opts.body)}</p>` : ''}
    ${btn(href, opts.actionLabel ?? 'Open Eventera')}
  `, { preheader: opts.body ?? opts.title });
  await sendEmail(opts.to, opts.title, html);
}

// ─── Welcome email ───────────────────────────────────────────────────────────

/** Sent once immediately after a new user creates their account. */
export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
}): Promise<void> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard`;
  const firstName = opts.name.split(' ')[0] || opts.name;

  await sendEmail(
    opts.to,
    `Welcome to Eventera, ${firstName} 👋`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em">
        Welcome to Eventera, ${esc(firstName)} 👋
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        We&apos;re glad you&apos;re here. Eventera helps event organisers create
        beautiful, personalised social cards that attendees actually share.
      </p>

      <table cellpadding="0" cellspacing="0" style="width:100%;border-radius:12px;overflow:hidden;border:1px solid #E5E0D4;margin-bottom:20px">
        <tr><td style="padding:16px 20px;background:#FAF6EE;border-bottom:1px solid #E5E0D4">
          <span style="font-size:18px">🎨</span>&nbsp;
          <strong style="font-size:14px;color:#0F1F18">Upload your event design</strong>
          <p style="margin:4px 0 0;font-size:13px;color:#65736B">Bring your own artwork — no templates, no constraints.</p>
        </td></tr>
        <tr><td style="padding:16px 20px;background:#FAF6EE;border-bottom:1px solid #E5E0D4">
          <span style="font-size:18px">✏️</span>&nbsp;
          <strong style="font-size:14px;color:#0F1F18">Define editable zones</strong>
          <p style="margin:4px 0 0;font-size:13px;color:#65736B">Mark where names, photos and titles should appear.</p>
        </td></tr>
        <tr><td style="padding:16px 20px;background:#FAF6EE">
          <span style="font-size:18px">🚀</span>&nbsp;
          <strong style="font-size:14px;color:#0F1F18">Share with attendees</strong>
          <p style="margin:4px 0 0;font-size:13px;color:#65736B">One link. Attendees fill in their info and download a personalised card.</p>
        </td></tr>
      </table>

      ${btn(dashboardUrl, 'Create your first event →')}

      <p style="margin:24px 0 0;font-size:13px;color:#65736B;line-height:1.6">
        Questions? Reply to this email — a real person reads every response.
      </p>
    `, { preheader: `We're glad you're here — here's how to create your first event on Eventera.` }),
  );
}

// ─── Milestone email ──────────────────────────────────────────────────────────

const MILESTONES = [10, 50, 100, 250, 500, 1000, 2500, 5000];

/** Send a download milestone notification if the count just crossed a threshold. */
export async function maybeSendDownloadMilestone(opts: {
  to: string;
  eventName: string;
  eventId: string;
  downloadCount: number;
  notifyEnabled: boolean;
}): Promise<void> {
  if (!opts.notifyEnabled) return;
  if (!MILESTONES.includes(opts.downloadCount)) return;

  const count = opts.downloadCount.toLocaleString();
  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${opts.eventId}`;

  await sendEmail(
    opts.to,
    `🎉 ${count} downloads — ${opts.eventName}`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em">
        ${count} cards downloaded 🎉
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        Your event <strong style="color:#0F1F18">${esc(opts.eventName)}</strong> just hit
        <strong style="color:#1F4D3A">${count} downloads</strong>. Attendees are sharing
        their personalised cards across social media.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-radius:12px;overflow:hidden;border:1px solid #E5E0D4">
        <tr>
          <td style="padding:16px 20px;background:#FAF6EE">
            <span style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:600;color:#65736B;text-transform:uppercase;letter-spacing:0.1em">Downloads</span>
            <div style="font-size:36px;font-weight:700;color:#1F4D3A;margin-top:4px">${count}</div>
          </td>
        </tr>
      </table>
      ${btn(eventUrl, 'View event analytics →')}
    `, { preheader: `${opts.eventName} just hit ${count} card downloads.` }),
  );
}

/** Notify the event owner when their monthly card cap is hit. */
export async function sendCapReachedEmail(opts: {
  to: string;
  eventId: string;
}): Promise<void> {
  if (!opts.to) return;
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/settings#billing`;
  await sendEmail(
    opts.to,
    `Your card limit has been reached`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em">
        Monthly card limit reached
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        Your event has reached its card limit for this month. New attendees won&apos;t be able
        to generate cards until the limit resets or you upgrade your plan.
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        Upgrade to <strong style="color:#1F4D3A">Pro</strong> or
        <strong style="color:#1F4D3A">Studio</strong> for a higher limit.
      </p>
      ${btn(upgradeUrl, 'Upgrade plan →')}
    `, { preheader: 'Your event has hit its monthly card limit — upgrade for more.' }),
  );
}

/** Send a notification when an event is published. */
export async function sendEventPublishedEmail(opts: {
  to: string;
  eventName: string;
  eventId: string;
  publicUrl: string;
}): Promise<void> {
  await sendEmail(
    opts.to,
    `Your event is live — ${opts.eventName}`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em">
        Your event is live ✅
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        <strong style="color:#0F1F18">${esc(opts.eventName)}</strong> is now published and accepting
        attendee registrations. Share the link below to start collecting cards.
      </p>
      <div style="background:#FAF6EE;border:1px solid #E5E0D4;border-radius:10px;padding:14px 16px;font-family:Inter,Arial,sans-serif;font-size:13px;color:#1F4D3A;word-break:break-all">
        ${opts.publicUrl}
      </div>
      ${btn(opts.publicUrl, 'Preview attendee page →')}
    `, { preheader: `${opts.eventName} is now live and accepting registrations.` }),
  );
}

/** Send a team invite email. */
export async function sendTeamInviteEmail(opts: {
  to: string;
  teamName: string;
  inviterName: string;
  acceptUrl: string;
  role: string;
}): Promise<void> {
  await sendEmail(
    opts.to,
    `${opts.inviterName} invited you to join ${opts.teamName} on Eventera`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em">
        You&apos;ve been invited
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        <strong style="color:#0F1F18">${esc(opts.inviterName)}</strong> has invited you to join
        <strong style="color:#0F1F18">${esc(opts.teamName)}</strong> on Eventera as a
        <strong style="color:#1F4D3A">${esc(opts.role)}</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:13px;color:#65736B">
        This invite expires in 7 days.
      </p>
      ${btn(opts.acceptUrl, 'Accept invitation →')}
    `, { preheader: `${opts.inviterName} invited you to join ${opts.teamName} as a ${opts.role}.` }),
  );
}

// ─── Networking emails ────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

/** Notify an attendee that someone wants to connect with them. */
export async function sendConnectionRequestEmail(opts: {
  to: string;
  recipientName: string;
  requesterName: string;
  eventName: string;
  eventSlug: string;
  registrationId: string;
}): Promise<void> {
  const peopleUrl = `${APP_URL}/attending/${opts.eventSlug}/networking?reg=${opts.registrationId}`;
  await sendEmail(
    opts.to,
    `${opts.requesterName} wants to connect at ${opts.eventName}`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;letter-spacing:-0.02em">
        New connection request
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        Hi ${esc(opts.recipientName)},<br><br>
        <strong style="color:#0F1F18">${esc(opts.requesterName)}</strong> wants to connect with you
        at <strong style="color:#0F1F18">${esc(opts.eventName)}</strong>.
        Visit the People tab to accept or ignore.
      </p>
      ${btn(peopleUrl, 'View connection request →')}
    `, { preheader: `${opts.requesterName} wants to connect with you at ${opts.eventName}.` }),
  );
}

/** Notify the requester that their connection request was accepted. */
export async function sendConnectionAcceptedEmail(opts: {
  to: string;
  requesterName: string;
  acceptorName: string;
  eventName: string;
  eventSlug: string;
  registrationId: string;
}): Promise<void> {
  const messagesUrl = `${APP_URL}/attending/${opts.eventSlug}/messages?reg=${opts.registrationId}`;
  await sendEmail(
    opts.to,
    `${opts.acceptorName} accepted your connection at ${opts.eventName}`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;letter-spacing:-0.02em">
        You&apos;re connected!
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        Hi ${esc(opts.requesterName)},<br><br>
        <strong style="color:#0F1F18">${esc(opts.acceptorName)}</strong> accepted your connection
        request at <strong style="color:#0F1F18">${esc(opts.eventName)}</strong>.
        Send them a message to start the conversation.
      </p>
      ${btn(messagesUrl, 'Send a message →')}
    `, { preheader: `${opts.acceptorName} accepted your connection request at ${opts.eventName}.` }),
  );
}

/** Notify an attendee that they have a new message. Sent once per new thread only. */
export async function sendNewMessageEmail(opts: {
  to: string;
  recipientName: string;
  senderName: string;
  eventName: string;
  eventSlug: string;
  registrationId: string;
  preview: string;
}): Promise<void> {
  const messagesUrl = `${APP_URL}/attending/${opts.eventSlug}/messages?reg=${opts.registrationId}`;
  const previewRaw = opts.preview.length > 120 ? opts.preview.slice(0, 117) + '…' : opts.preview;
  const preview = esc(previewRaw);
  await sendEmail(
    opts.to,
    `New message from ${opts.senderName} at ${opts.eventName}`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;letter-spacing:-0.02em">
        New message
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        Hi ${esc(opts.recipientName)},<br><br>
        <strong style="color:#0F1F18">${esc(opts.senderName)}</strong> sent you a message
        at <strong style="color:#0F1F18">${esc(opts.eventName)}</strong>.
      </p>
      <div style="background:#FAF6EE;border-left:3px solid #1F4D3A;border-radius:4px;padding:14px 16px;font-size:13.5px;color:#3A4A42;line-height:1.6;margin-bottom:4px">
        ${preview}
      </div>
      ${btn(messagesUrl, 'Reply →')}
    `, { preheader: `${opts.senderName}: ${previewRaw}` }),
  );
}

/** Notify an attendee that their Q&A question was answered. */
export async function sendQAAnsweredEmail(opts: {
  to: string;
  attendeeName: string;
  question: string;
  eventName: string;
  eventSlug: string;
  registrationId: string;
}): Promise<void> {
  const qaUrl = `${APP_URL}/attending/${opts.eventSlug}/q-and-a?reg=${opts.registrationId}`;
  const questionPreviewRaw = opts.question.length > 140 ? opts.question.slice(0, 137) + '…' : opts.question;
  const questionPreview = esc(questionPreviewRaw);
  await sendEmail(
    opts.to,
    `Your question was answered at ${opts.eventName}`,
    wrap(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;letter-spacing:-0.02em">
        Your question was answered ✅
      </h1>
      <p style="margin:0 0 16px;font-size:14px;color:#65736B;line-height:1.6">
        Hi ${esc(opts.attendeeName)},<br><br>
        The organiser has answered your question at
        <strong style="color:#0F1F18">${esc(opts.eventName)}</strong>.
      </p>
      <div style="background:#FAF6EE;border-left:3px solid #1F4D3A;border-radius:4px;padding:14px 16px;font-size:13.5px;color:#3A4A42;line-height:1.6;margin-bottom:4px">
        &ldquo;${questionPreview}&rdquo;
      </div>
      ${btn(qaUrl, 'See the answer →')}
    `, { preheader: `The organiser answered your question at ${opts.eventName}.` }),
  );
}
