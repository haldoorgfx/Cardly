export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { PageShell } from '@/components/dash';
import AbstractReviewClient from '@/components/abstracts/AbstractReviewClient';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string }> }

export default async function AbstractsPage({ params }: Props) {
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
    .select('id, name, slug')
    .eq('id', id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();
  if (!event) redirect('/dashboard');

  const { data: sessions } = await admin
    .from('sessions')
    .select('id, title')
    .eq('event_id', id)
    .order('starts_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: abstracts } = await (admin as any)
    .from('abstracts')
    .select('id, title, authors, category, keywords, body, pdf_url, status, submitted_at, review_notes, assigned_session')
    .eq('event_id', id)
    .order('submitted_at', { ascending: false });

  return (
    <PageShell width="wide">
      <AbstractReviewClient
        eventId={id}
        eventSlug={event.slug}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialAbstracts={(abstracts ?? []) as any}
        sessions={(sessions ?? []) as { id: string; title: string }[]}
      />
    </PageShell>
  );
}
