export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Template preview' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { TemplatePreviewClient } from '@/components/communications/TemplatePreviewClient';
import type { WATemplate } from '@/components/communications/whatsapp-model';

interface Props { params: Promise<{ id: string }> }

export default async function PreviewPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const { data: event } = await db.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  const { data: tpls } = await db.from('message_templates').select('*')
    .or(`event_id.eq.${id},and(owner_id.eq.${user.id},event_id.is.null)`)
    .order('created_at', { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templates: WATemplate[] = ((tpls ?? []) as any[]).map((t) => ({
    id: t.id, name: t.name, category: t.category, approval_status: t.approval_status,
    body: t.body ?? null, event_id: t.event_id ?? null,
  }));

  return <TemplatePreviewClient eventSlug={event.slug} eventName={event.name} templates={templates} />;
}
