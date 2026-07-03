import { createAdminClient } from '@/lib/supabase/server';

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

export async function createNotification(params: CreateNotificationParams) {
  try {
    const admin = createAdminClient();
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
    // Notifications are non-critical — never throw
  }
}
