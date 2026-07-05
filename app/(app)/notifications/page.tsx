export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotificationsCenter from './NotificationsCenter';

type NotifPrefs = Record<string, boolean>;

interface NotifRow {
  id: string;
  icon: string | null;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/notifications');

  const [notifsRes, profileRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, icon, title, body, action_url, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('profiles')
      .select('notification_prefs')
      .eq('id', user.id)
      .single(),
  ]);

  const initialNotifs = (notifsRes.data ?? []) as NotifRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialPrefs = ((profileRes.data as any)?.notification_prefs ?? {}) as NotifPrefs;

  return <NotificationsCenter initialNotifs={initialNotifs} initialPrefs={initialPrefs} />;
}
