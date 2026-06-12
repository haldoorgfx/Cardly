export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AICopilotClient } from '@/components/events/AICopilotClient';

export async function generateMetadata() {
  return { title: 'AI Copilot' };
}

export default async function CopilotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Fetch key event stats for AI context
  const [{ count: regCount }, { count: checkInCount }] = await Promise.all([
    adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'confirmed'),
    adminAny.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'checked_in'),
  ]);

  return (
    <AICopilotClient
      eventId={id}
      eventName={event.name}
      eventSlug={event.slug}
      stats={{ registrations: regCount ?? 0, checkedIn: checkInCount ?? 0 }}
    />
  );
}
