export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Event days' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EventDaysClient } from '@/components/events/EventDaysClient';
import type { EventDayLite, DayEntitlementLite, DayInput } from '@/components/events/event-day-model';
import type { EntitlementType } from '@/components/tickets/EntitlementIcon';
import { PageShell } from '@/components/dash';

interface Props { params: Promise<{ id: string }> }

// Re-derive the caller from the session and confirm they own this event.
// Module-level so it is NOT itself exposed as a server-action endpoint.
async function verifyEventOwner(eventId: string): Promise<boolean> {
  const supa = createClient();
  const { data: { user: caller } } = await supa.auth.getUser();
  if (!caller) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', caller.id).maybeSingle();
  return !!data;
}

/** Server-side sanitize + validate of a day payload. Never trust the client. */
function cleanDayInput(input: DayInput): { value: { date: string | null; checkin_enabled: boolean; capacity: number | null }; entitlementIds: string[] } | { error: string } {
  let date: string | null = null;
  if (input?.date) {
    const raw = String(input.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || isNaN(new Date(raw).getTime())) return { error: 'Enter a valid date' };
    date = raw;
  }
  let capacity: number | null = null;
  if (input?.capacity !== null && input?.capacity !== undefined) {
    const c = Number(input.capacity);
    if (!Number.isInteger(c) || c < 1) return { error: 'Capacity must be a whole number of 1 or more' };
    capacity = c;
  }
  const entitlementIds = Array.isArray(input?.entitlementIds) ? input.entitlementIds.filter((x) => typeof x === 'string') : [];
  return { value: { date, checkin_enabled: !!input?.checkin_enabled, capacity }, entitlementIds };
}

// Keep only entitlement ids that really belong to this event.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function filterEventEntitlementIds(admin: any, eventId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data } = await admin.from('entitlements').select('id').eq('event_id', eventId).in('id', ids);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => r.id as string);
}

// Confirm a day belongs to this event before mutating it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dayBelongsToEvent(admin: any, eventId: string, dayId: string): Promise<boolean> {
  const { data } = await admin.from('event_days').select('id').eq('id', dayId).eq('event_id', eventId).maybeSingle();
  return !!data;
}

export default async function EventDaysPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // types/database.ts is frozen and lacks event_days / event_day_entitlements → untyped client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: event } = await db.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  const [{ data: dayRows }, { data: entRows }] = await Promise.all([
    db.from('event_days').select('id, day_index, date, checkin_enabled, capacity').eq('event_id', id).order('day_index', { ascending: true }),
    db.from('entitlements').select('id, name, type').eq('event_id', id).order('type', { ascending: true }).order('name', { ascending: true }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days: any[] = dayRows ?? [];
  const dayIds: string[] = days.map((d) => d.id);

  // Per-day entitlement links.
  const entByDay = new Map<string, string[]>();
  if (dayIds.length > 0) {
    const { data: ede } = await db.from('event_day_entitlements').select('event_day_id, entitlement_id').in('event_day_id', dayIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of ((ede ?? []) as any[])) {
      const arr = entByDay.get(row.event_day_id) ?? [];
      arr.push(row.entitlement_id);
      entByDay.set(row.event_day_id, arr);
    }
  }

  const initialDays: EventDayLite[] = days.map((d) => ({
    id: d.id,
    day_index: d.day_index,
    date: d.date ?? null,
    checkin_enabled: !!d.checkin_enabled,
    capacity: d.capacity ?? null,
    entitlementIds: entByDay.get(d.id) ?? [],
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entitlements: DayEntitlementLite[] = ((entRows ?? []) as any[]).map((e) => ({
    id: e.id, name: e.name, type: e.type as EntitlementType,
  }));

  // ── Server actions ──────────────────────────────────────────────────────

  async function addDay(): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'Not authorized' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data: existing } = await admin.from('event_days').select('day_index').eq('event_id', id).order('day_index', { ascending: false }).limit(1);
    const nextIndex = (existing?.[0]?.day_index ?? -1) + 1;
    const { error } = await admin.from('event_days').insert({ event_id: id, day_index: nextIndex, checkin_enabled: true });
    if (error) return { error: error.message };
    revalidatePath(`/events/${id}/settings/days`);
    return { ok: true };
  }

  async function saveDay(dayId: string, input: DayInput): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'Not authorized' };
    const cleaned = cleanDayInput(input);
    if ('error' in cleaned) return { error: cleaned.error };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    if (!(await dayBelongsToEvent(admin, id, dayId))) return { error: 'Day not found' };

    const { error } = await admin.from('event_days').update(cleaned.value).eq('id', dayId).eq('event_id', id);
    if (error) return { error: error.message };

    // Re-sync per-day entitlement links: drop all, re-insert the valid selected set.
    const entIds = await filterEventEntitlementIds(admin, id, cleaned.entitlementIds);
    const { error: delErr } = await admin.from('event_day_entitlements').delete().eq('event_day_id', dayId);
    if (delErr) return { error: delErr.message };
    if (entIds.length > 0) {
      const { error: linkErr } = await admin
        .from('event_day_entitlements')
        .insert(entIds.map((entitlement_id: string) => ({ event_day_id: dayId, entitlement_id })));
      if (linkErr) return { error: linkErr.message };
    }
    revalidatePath(`/events/${id}/settings/days`);
    return { ok: true };
  }

  async function removeDay(dayId: string): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'Not authorized' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { error } = await admin.from('event_days').delete().eq('id', dayId).eq('event_id', id);
    if (error) return { error: error.message };
    revalidatePath(`/events/${id}/settings/days`);
    return { ok: true };
  }

  return (
    <PageShell width="wide">
      <div className="mb-6">
        <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
          Event days
        </h1>
        <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
          Turn {event.name} into a multi-day event. Give each day its own date, check-in toggle and capacity, and choose which entitlements are valid that day. Leave it empty for a single-day event.
        </p>
        {initialDays.length > 0 && (
          <a href={`/events/${id}/registrations/attendance`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mt-3"
            style={{ color: '#1F4D3A' }}>
            View attendance by day →
          </a>
        )}
      </div>
      <div className="pb-16">
        <EventDaysClient
          initialDays={initialDays}
          entitlements={entitlements}
          addDay={addDay}
          saveDay={saveDay}
          removeDay={removeDay}
        />
      </div>
    </PageShell>
  );
}
