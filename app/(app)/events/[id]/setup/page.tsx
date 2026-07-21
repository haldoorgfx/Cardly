export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { SetupWizard } from '@/components/events/SetupWizard';
import type { Speaker } from '@/types/database';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string }> }

export default async function SetupPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [
    { data: event },
    { data: eventPage },
    { data: tickets },
    { data: formFields },
    { data: speakers },
  ] = await Promise.all([
    admin.from('events').select('id, name, slug, status').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('event_pages').select('*').eq('event_id', id).maybeSingle(),
    admin.from('ticket_types').select('*').eq('event_id', id).order('position'),
    admin.from('registration_form_fields').select('*').eq('event_id', id).order('position'),
    admin.from('speakers').select('*').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <SetupWizard
      eventId={id}
      eventSlug={event.slug}
      eventName={event.name}
      eventStatus={event.status ?? 'draft'}
      existingPage={eventPage}
      initialTickets={tickets ?? []}
      initialFormFields={formFields ?? []}
      initialSpeakers={(speakers ?? []) as Speaker[]}
    />
  );
}
