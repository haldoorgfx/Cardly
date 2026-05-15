export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CanvasEditor from '@/components/editor/CanvasEditor';
import type { Variant } from '@/types/database';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: variantsData } = await admin
    .from('event_variants')
    .select('*')
    .eq('event_id', id)
    .order('position', { ascending: true });

  const variants = (variantsData ?? []) as unknown as Variant[];

  return (
    <CanvasEditor
      eventId={event.id}
      eventName={event.name}
      variants={variants}
    />
  );
}
