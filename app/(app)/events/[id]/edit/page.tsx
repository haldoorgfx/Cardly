import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CanvasEditor from '@/components/editor/CanvasEditor';
import type { Zone } from '@/types/database';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  return (
    <CanvasEditor
      eventId={event.id}
      eventName={event.name}
      backgroundUrl={event.background_url ?? ''}
      initialZones={(event.zones as unknown as Zone[]) ?? []}
    />
  );
}
