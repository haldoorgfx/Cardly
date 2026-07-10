/**
 * Channel-availability resolver for the notification/broadcast layer.
 *
 * HONESTY: Eventera has no WhatsApp Business API credentials and no SMS provider
 * on this deployment. Email (Resend REST) and in-app (the notifications table)
 * genuinely work; WhatsApp and SMS cannot dispatch until a provider is
 * configured. This module is the single source of truth for that fact so the UI
 * can disable a channel with a plain-English reason instead of faking a toggle.
 *
 * Must run server-side only — it reads non-public env vars. Pages compute the
 * availability and pass the plain object down to client components as props.
 */

export interface ChannelState {
  available: boolean;
  /** One-line reason a channel is unavailable, or null when it works. */
  reason: string | null;
}

export interface ChannelAvailability {
  email: ChannelState;
  inapp: ChannelState;
  whatsapp: ChannelState;
  sms: ChannelState;
}

/** Email really sends only when a Resend key is present. */
export function emailProviderConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// Flip to true ONLY when a real WhatsApp send is implemented in
// lib/notifications/broadcast.ts. Until then WhatsApp must never be advertised
// as an available channel — env vars alone don't send a message, and the
// dispatcher currently records every WhatsApp recipient as 'skipped'. Claiming
// availability here while the dispatcher skips would report broadcasts as sent
// when nothing went out.
const WHATSAPP_DISPATCH_IMPLEMENTED = false;

/** True only when a real WhatsApp Business provider binding AND a working sender exist. */
export function whatsappProviderConfigured(): boolean {
  return (
    WHATSAPP_DISPATCH_IMPLEMENTED &&
    !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
  );
}

/** True only when a real SMS provider (e.g. Twilio) binding exists on the server. */
export function smsProviderConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Resolve which channels can actually deliver right now.
 *
 * @param hasConnectedNumber whether a whatsapp_connections row with
 *        status 'connected' exists for this event/owner.
 */
export function resolveChannelAvailability(hasConnectedNumber: boolean): ChannelAvailability {
  const whatsappReason = !hasConnectedNumber
    ? 'WhatsApp not connected — connect a number to enable'
    : !whatsappProviderConfigured()
      ? 'Number connected, but no WhatsApp Business provider is configured on this server yet'
      : null;

  return {
    email: emailProviderConfigured()
      ? { available: true, reason: null }
      : { available: false, reason: 'Email sending is not configured on this server yet' },
    inapp: { available: true, reason: null },
    whatsapp: { available: whatsappReason === null, reason: whatsappReason },
    sms: smsProviderConfigured()
      ? { available: true, reason: null }
      : { available: false, reason: 'SMS is not configured on this server yet' },
  };
}
