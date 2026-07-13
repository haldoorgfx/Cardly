export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { RegistrationFormBuilder } from '@/components/events/RegistrationFormBuilder';
import { PageShell, PageHeader } from '@/components/dash';

interface Props { params: Promise<{ id: string }> }

export default async function FormBuilderPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: fields }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('registration_form_fields').select('*').eq('event_id', id).order('position'),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <PageShell width="wide">
      <PageHeader
        title="Registration form"
        subtitle="Collect anything extra from attendees — company, city, dietary needs, custom questions."
      />
      <div className="pb-16">
        <RegistrationFormBuilder eventId={id} initialFields={fields ?? []} />
      </div>
    </PageShell>
  );
}
