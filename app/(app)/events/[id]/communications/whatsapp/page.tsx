export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'WhatsApp' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { whatsappProviderConfigured } from '@/lib/notifications/channels';
import { WhatsAppConnectClient } from '@/components/communications/WhatsAppConnectClient';
import type { WAConnection, WATemplate, TemplateInput } from '@/components/communications/whatsapp-model';

interface Props { params: Promise<{ id: string }> }

// Re-derive the caller from the session and confirm they own this event.
// Module-level so it is NOT itself exposed as a server-action endpoint.
async function verifyEventOwner(eventId: string): Promise<string | null> {
  const supa = createClient();
  const { data: { user: caller } } = await supa.auth.getUser();
  if (!caller) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', caller.id).maybeSingle();
  return data ? caller.id : null;
}

const CATEGORIES = ['utility', 'marketing', 'authentication'] as const;

export default async function WhatsAppPage({ params }: Props) {
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

  const [{ data: conns }, { data: tpls }] = await Promise.all([
    db.from('whatsapp_connections').select('*')
      .or(`event_id.eq.${id},and(owner_id.eq.${user.id},event_id.is.null)`)
      .order('created_at', { ascending: false }),
    db.from('message_templates').select('*')
      .or(`event_id.eq.${id},and(owner_id.eq.${user.id},event_id.is.null)`)
      .order('created_at', { ascending: false }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connections: WAConnection[] = ((conns ?? []) as any[]).map((c) => ({
    id: c.id, phone_number: c.phone_number, waba_id: c.waba_id ?? null,
    status: c.status, event_id: c.event_id ?? null, created_at: c.created_at,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templates: WATemplate[] = ((tpls ?? []) as any[]).map((t) => ({
    id: t.id, name: t.name, category: t.category, approval_status: t.approval_status,
    body: t.body ?? null, event_id: t.event_id ?? null,
  }));

  // ── Server actions ───────────────────────────────────────────────────────
  async function connectWhatsApp(phone: string, waba: string): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    const ownerId = await verifyEventOwner(id);
    if (!ownerId) return { error: 'You can no longer manage this event.' };
    const phone_number = String(phone ?? '').trim();
    if (!/^\+?[0-9 ()-]{6,20}$/.test(phone_number)) return { error: 'Enter a valid phone number in international format.' };
    const waba_id = String(waba ?? '').trim() || null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { error } = await admin.from('whatsapp_connections').insert({
      event_id: id, owner_id: ownerId, phone_number, waba_id, status: 'connected',
    });
    if (error) return { error: error.message };
    revalidatePath(`/events/${id}/communications/whatsapp`);
    return { ok: true };
  }

  async function disconnectWhatsApp(connId: string): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    const ownerId = await verifyEventOwner(id);
    if (!ownerId) return { error: 'You can no longer manage this event.' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { error } = await admin.from('whatsapp_connections')
      .update({ status: 'disconnected' })
      .eq('id', connId)
      .or(`event_id.eq.${id},and(owner_id.eq.${ownerId},event_id.is.null)`);
    if (error) return { error: error.message };
    revalidatePath(`/events/${id}/communications/whatsapp`);
    return { ok: true };
  }

  async function createTemplate(input: TemplateInput): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    const ownerId = await verifyEventOwner(id);
    if (!ownerId) return { error: 'You can no longer manage this event.' };
    const name = String(input?.name ?? '').trim();
    if (!name) return { error: 'Template name is required.' };
    if (name.length > 120) return { error: 'Name must be under 120 characters.' };
    if (!CATEGORIES.includes(input?.category)) return { error: 'Pick a valid category.' };
    const body = String(input?.body ?? '').trim();
    if (!body) return { error: 'Template body is required.' };
    if (body.length > 1024) return { error: 'Body must be under 1024 characters.' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { error } = await admin.from('message_templates').insert({
      event_id: id, owner_id: ownerId, name, category: input.category, body, approval_status: 'pending',
    });
    if (error) return { error: error.message };
    revalidatePath(`/events/${id}/communications/whatsapp`);
    return { ok: true };
  }

  return (
    <WhatsAppConnectClient
      eventSlug={event.slug}
      connections={connections}
      templates={templates}
      providerConfigured={whatsappProviderConfigured()}
      connectWhatsApp={connectWhatsApp}
      disconnectWhatsApp={disconnectWhatsApp}
      createTemplate={createTemplate}
    />
  );
}
