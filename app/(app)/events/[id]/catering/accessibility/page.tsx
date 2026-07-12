export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Accessibility' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { AccessibilityClient } from '@/components/catering/AccessibilityClient';
import type { AccessSummary } from '@/components/catering/AccessibilityClient';

interface Props { params: Promise<{ id: string }> }

export default async function AccessibilityPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!event) redirect('/dashboard');

  // accessibility_summary authorises on auth.uid() → SESSION client, and catch
  // its NOT_AUTHORISED (P0001) rather than 500.
  let summary: AccessSummary | null = null;
  let loadError: 'auth' | 'generic' | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionDb = createClient() as any;
    const { data, error } = await sessionDb.rpc('accessibility_summary', { p_event_id: id });
    if (error) {
      loadError = error.code === 'P0001' && /NOT_AUTHORISED/.test(error.message ?? '') ? 'auth' : 'generic';
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const byTag = ((data?.by_tag ?? []) as any[]).map((t) => ({ tag: String(t.tag ?? ''), count: Number(t.count ?? 0) }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attendees = ((data?.attendees ?? []) as any[]).map((a) => ({
        registration_id: String(a.registration_id),
        name: a.name ?? null,
        email: a.email ?? null,
        phone: a.phone ?? null,
        accessibility: Array.isArray(a.accessibility) ? (a.accessibility as string[]) : [],
        note: a.note ?? null,
      }));
      summary = { total_with_needs: Number(data?.total_with_needs ?? 0), by_tag: byTag, attendees };
    }
  } catch {
    loadError = 'generic';
  }

  return <AccessibilityClient eventSlug={event.slug} data={summary} loadError={loadError} />;
}
