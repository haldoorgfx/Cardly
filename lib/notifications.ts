import { createAdminClient } from '@/lib/supabase/server';
import { sendNotificationEmail } from '@/lib/email';
import { sendPushToUser } from '@/lib/push';

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

// Which `notification_prefs.*_email` flag gates the EMAIL copy of each type.
// Types not listed always email (transactional / important by default).
const TYPE_EMAIL_PREF: Partial<Record<NotificationType, string>> = {
  registration:     'tickets_email',
  ticket_confirmed: 'tickets_email',
  ticket_sale:      'tickets_email',
  event_reminder:   'reminders_email',
  event_update:     'agenda_changes_email',
  new_event:        'organizer_follows_email',
  // milestone / sponsor / system / card_download → always email
};

function emailAllowed(
  prefs: Record<string, unknown> | null | undefined,
  type: NotificationType,
): boolean {
  const key = TYPE_EMAIL_PREF[type];
  if (!key) return true;         // no gate for this type → send
  if (!prefs) return true;       // prefs default to on
  return prefs[key] !== false;   // only an explicit false disables it
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

  // 3) Email — pref-aware. No-ops without RESEND_API_KEY.
  if (email && emailAllowed(prefs, params.type)) {
    await sendNotificationEmail({
      to: email,
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
    });
  }

  // 4) Push — to all the user's devices. No-op until Firebase is provisioned.
  await sendPushToUser({
    userId: params.userId,
    title: params.title,
    body: params.body,
    url: params.actionUrl,
  });
}

/**
 * Back-compat entry point. Existing callers keep calling createNotification and
 * now automatically get the full fan-out (in-app + email + push).
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  await notify(params);
}
