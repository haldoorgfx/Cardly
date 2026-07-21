export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import nextDynamic from 'next/dynamic';
import type { Variant } from '@/types/database';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

// Dynamic import keeps the 2,700-line CanvasEditor out of the initial JS bundle.
// It only loads when the user actually navigates to the edit page.
const CanvasEditor = nextDynamic(() => import('@/components/editor/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 grid place-items-center bg-[#FAF6EE]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#1F4D3A] border-t-transparent animate-spin" />
        <span className="text-[13px] text-[#65736B] font-medium">Loading editor…</span>
      </div>
    </div>
  ),
});

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status')
    .eq('id', id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();

  if (!event) redirect('/dashboard');

  const { data: variantsData } = await admin
    .from('event_variants')
    .select('id, variant_name, variant_slug, background_url, background_width, background_height, zones, position')
    .eq('event_id', id)
    .order('position', { ascending: true });

  const variants = (variantsData ?? []) as unknown as Variant[];

  return (
    <CanvasEditor
      eventId={event.id}
      eventName={event.name}
      eventSlug={event.slug}
      variants={variants}
    />
  );
}
