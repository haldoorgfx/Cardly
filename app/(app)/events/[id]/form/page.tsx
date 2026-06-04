export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationTabs } from '@/components/events/RegistrationTabs';
import { RegistrationFormBuilder } from '@/components/events/RegistrationFormBuilder';

interface Props { params: Promise<{ id: string }> }

export default async function FormBuilderPage({ params }: Props) {
  const { id } = await params;
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
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <RegistrationTabs eventId={id} eventName={event.name} />
      <div className="max-w-[700px] mx-auto px-6 py-8 pb-24">
        <div className="mb-6">
          <h1
            className="font-display font-semibold text-[24px]"
            style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
          >
            Registration form
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Collect anything extra from attendees — company, city, dietary needs, custom questions.
          </p>
        </div>
        <RegistrationFormBuilder eventId={id} initialFields={fields ?? []} />
      </div>
    </div>
  );
}
