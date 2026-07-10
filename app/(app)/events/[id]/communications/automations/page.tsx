export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Journey automations' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { resolveChannelAvailability } from '@/lib/notifications/channels';
import { AutomationsClient } from '@/components/communications/AutomationsClient';
import type { AutomationRow, JourneyStep } from '@/components/communications/whatsapp-model';

interface Props { params: Promise<{ id: string }> }

const STEPS: JourneyStep[] = ['registration', 'd7', 'd1', 'h1', 'during', 'post'];

async function verifyEventOwner(eventId: string): Promise<boolean> {
  const supa = createClient();
  const { data: { user: caller } } = await supa.auth.getUser();
  if (!caller) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', caller.id).maybeSingle();
  return !!data;
}

export default async function AutomationsPage({ params }: Props) {
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

  const [{ data: autos }, { data: conns }] = await Promise.all([
    db.from('notification_automations').select('step, enabled, channels').eq('event_id', id),
    db.from('whatsapp_connections').select('id')
      .or(`event_id.eq.${id},and(owner_id.eq.${user.id},event_id.is.null)`)
      .eq('status', 'connected').limit(1),
  ]);

  const byStep = new Map<string, { enabled: boolean; channels: { email: boolean; whatsapp: boolean; sms: boolean } }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((autos ?? []) as any[]).forEach((a) => {
    const ch = (a.channels ?? {}) as Record<string, boolean>;
    byStep.set(a.step, { enabled: !!a.enabled, channels: { email: ch.email !== false, whatsapp: !!ch.whatsapp, sms: !!ch.sms } });
  });

  const rows: AutomationRow[] = STEPS.map((step) => {
    const cur = byStep.get(step);
    return { step, enabled: cur?.enabled ?? false, channels: cur?.channels ?? { email: true, whatsapp: false, sms: false } };
  });

  const availability = resolveChannelAvailability(((conns ?? []) as unknown[]).length > 0);

  // ── Server action: upsert one journey step ───────────────────────────────
  async function saveStep(
    step: string,
    enabled: boolean,
    channels: { email: boolean; whatsapp: boolean; sms: boolean },
  ): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    if (!STEPS.includes(step as JourneyStep)) return { error: 'Invalid step' };
    if (!(await verifyEventOwner(id))) return { error: 'You can no longer manage this event.' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    // Server-authoritative: a channel that is not configured can never be enabled.
    const { data: liveConn } = await admin.from('whatsapp_connections').select('id')
      .eq('event_id', id).eq('status', 'connected').limit(1);
    const av = resolveChannelAvailability(((liveConn ?? []) as unknown[]).length > 0);
    const safe = {
      email: av.email.available ? !!channels.email : false,
      whatsapp: av.whatsapp.available ? !!channels.whatsapp : false,
      sms: av.sms.available ? !!channels.sms : false,
    };
    const { error } = await admin
      .from('notification_automations')
      .upsert({ event_id: id, step, enabled: !!enabled, channels: safe }, { onConflict: 'event_id,step' });
    if (error) return { error: error.message };
    revalidatePath(`/events/${id}/communications/automations`);
    return { ok: true };
  }

  return (
    <AutomationsClient
      eventSlug={event.slug}
      rows={rows}
      availability={availability}
      saveStep={saveStep}
    />
  );
}
