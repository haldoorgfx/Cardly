import { createAdminClient } from '@/lib/supabase/server';
import { sendNotificationEmail } from '@/lib/email';
import { sendPushToUser } from '@/lib/push';
import type { NotifKey } from '@/lib/notifications/prefs';

type NotificationType = 'registration' | 'card_download' | 'ticket_sale' | 'milestone' | 'sponsor' | 'system' | 'ticket_confirmed' | 'event_reminder' | 'new_event' | 'event_update';

interface CreateNotificationParams {
  userId: string;
  eventId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  actionUrl?: string;
  icon?: string;
}

const TYPE_ICONS: Record<NotificationType, string> = {
  registration:  'users',
  card_download: 'card',
  ticket_sale:   'dollar',
  milestone:     'star',
  sponsor:       'briefcase',
  system:        'bell',
  ticket_confirmed: 'card',
  event_reminder:   'bell',
  new_event:        'star',
  event_update:     'bell',
};

// Which `notification_prefs` category gates each type. Types not listed are
// transactional / important and always send.
//
// These are the CANONICAL BARE keys the Notifications center actually writes
// (see lib/notifications/prefs.ts). This map previously used channel-suffixed
// keys ('tickets_email', …) that the UI never writes, so every lookup returned
// undefined, `!== false` was always true, and EVERY opt-out was ignored — a
// user who unchecked "Tickets & receipts" still received all of them.
const TYPE_NOTIF_KEY: Partial<Record<NotificationType, NotifKey>> = {
  registration:     'tickets',
  ticket_confirmed: 'tickets',
  ticket_sale:      'tickets',
  event_reminder:   'reminders',
  event_update:     'agenda_changes',
  new_event:        'organizer_follows',
  // milestone / sponsor / system / card_download → always send
};

/**
 * Mirrors lib/notifications/prefs.ts#isNotifAllowed, but against the prefs row
 * notify() has already loaded (so we don't re-query per channel). Same opt-out
 * model: allowed unless EXPLICITLY false; unset → allowed; unknown → allowed.
 */
function categoryAllowed(
  prefs: Record<string, unknown> | null | undefined,
  type: NotificationType,
): boolean {
  const key = TYPE_NOTIF_KEY[type];
  if (!key) return true;   // no gate for this type → send
  if (!prefs) return true; // never set → opt-out model, allowed
  // 1. Canonical bare key wins.
  if (typeof prefs[key] === 'boolean') return prefs[key] as boolean;
  // 2. An explicit legacy `<key>_email` opt-out still counts.
  const legacy = prefs[`${key}_email`];
  if (typeof legacy === 'boolean') return legacy;
  return true;
}

/**
 * The single fan-out for a user notification. Writes the in-app row (the
 * Supabase source of truth that app + web read via RLS/realtime) and — honoring
 * the user's `notification_prefs` — also emails and pushes. Every caller gets
 * all three channels for free.
 *
 * Non-critical by design: each channel is independently guarded so a failure in
 * one never blocks the others or throws into the calling request. Email no-ops
 * without RESEND_API_KEY; push no-ops until Firebase is provisioned.
 */
export async function notify(params: CreateNotificationParams): Promise<void> {
  const admin = createAdminClient();

  // 1) In-app — always. The row app + web read.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('notifications').insert({
      user_id:    params.userId,
      event_id:   params.eventId ?? null,
      type:       params.type,
      title:      params.title,
      body:       params.body ?? null,
      action_url: params.actionUrl ?? null,
      icon:       params.icon ?? TYPE_ICONS[params.type],
    });
  } catch {
    // In-app write failed — still attempt the other channels below.
  }

  // 2) Resolve the recipient's email + notification prefs once.
  let email: string | null = null;
  let prefs: Record<string, unknown> | null = null;
  try {
    const { data: userRes } = await admin.auth.admin.getUserById(params.userId);
    email = userRes.user?.email ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin as any)
      .from('profiles')
      .select('notification_prefs')
      .eq('id', params.userId)
      .maybeSingle();
    prefs = (profile?.notification_prefs as Record<string, unknown>) ?? null;
  } catch {
    // Couldn't resolve recipient — email stays null and is skipped.
  }

  // Same gate for both outbound channels.
  const allowed = categoryAllowed(prefs, params.type);

  // 3) Email — pref-aware. No-ops without RESEND_API_KEY.
  if (email && allowed) {
    await sendNotificationEmail({
      to: email,
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
    });
  }

  // 4) Push — to all the user's devices. No-op until Firebase is provisioned.
  // Previously ungated entirely: turning a category off still fired an OS
  // banner for every one of them.
  if (allowed) {
    await sendPushToUser({
      userId: params.userId,
      title: params.title,
      body: params.body,
      url: params.actionUrl,
    });
  }
}

/**
 * Back-compat entry point. Existing callers keep calling createNotification and
 * now automatically get the full fan-out (in-app + email + push).
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  await notify(params);
}

/**
 * Notify an event's organizer that someone new registered — in-app + email +
 * push via notify(). Fires for every registration path (free, Stripe, WaafiPay,
 * Flutterwave), not just manual walk-in adds.
 *
 * Honors the "New registrations" toggle (`profiles.notify_registrations`):
 * only an explicit `false` opts the organizer out; a missing/true value sends.
 *
 * Fully non-blocking — the whole body is wrapped so it can never throw into the
 * registration/webhook request that calls it.
 */
export async function notifyOrganizerNewRegistration(opts: {
  organizerId: string | null | undefined;
  eventId: string;
  eventName: string;
  attendeeName: string;
}): Promise<void> {
  try {
    if (!opts.organizerId) return;

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin as any)
      .from('profiles')
      .select('notify_registrations')
      .eq('id', opts.organizerId)
      .maybeSingle();
    // Default on — only an explicit false opts out.
    if (profile?.notify_registrations === false) return;

    await notify({
      userId: opts.organizerId,
      eventId: opts.eventId,
      type: 'registration',
      title: `New registration · ${opts.eventName}`,
      body: `${opts.attendeeName} just registered.`,
      actionUrl: `/events/${opts.eventId}/registrations`,
    });
  } catch {
    // Never throw into the calling request.
  }
}
