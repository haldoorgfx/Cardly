export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import NotificationsInbox from '@/components/account/NotificationsInbox';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications' };

export default async function AccountNotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/account/notifications');

  const { data: notifs } = await supabase
    .from('notifications')
    .select('id, type, title, body, action_url, icon, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60);

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[680px] mx-auto px-5 pb-24" style={{ paddingTop: 44 }}>
        <NotificationsInbox initialNotifs={notifs ?? []} />
      </div>
    </div>
  );
}
