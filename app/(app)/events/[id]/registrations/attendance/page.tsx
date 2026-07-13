export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Attendance by day' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { PageShell, PageHeader } from '@/components/dash';
import { AttendanceGrid } from '@/components/events/AttendanceGrid';
import {
  computeAttendanceGrid,
  type DayDef,
  type AttendeeDef,
  type AttendanceGrid as AttendanceGridData,
} from '@/lib/multiday/attendance';

interface Props { params: Promise<{ id: string }> }

export default async function AttendancePage({ params }: Props) {
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

  let days: DayDef[] = [];
  let attendees: AttendeeDef[] = [];
  let grid: AttendanceGridData = { cells: {}, perDay: [] };
  let loadError = false;

  try {
    const { data: dayRows, error: dayErr } = await db
      .from('event_days')
      .select('id, day_index, date, capacity')
      .eq('event_id', id)
      .order('day_index', { ascending: true });
    if (dayErr) throw dayErr;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dRows: any[] = dayRows ?? [];
    const dayIds: string[] = dRows.map((d) => d.id);

    // Per-day entitlement links.
    const entByDay = new Map<string, string[]>();
    if (dayIds.length > 0) {
      const { data: ede, error: edeErr } = await db
        .from('event_day_entitlements')
        .select('event_day_id, entitlement_id')
        .in('event_day_id', dayIds);
      if (edeErr) throw edeErr;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of ((ede ?? []) as any[])) {
        const arr = entByDay.get(row.event_day_id) ?? [];
        arr.push(row.entitlement_id);
        entByDay.set(row.event_day_id, arr);
      }
    }

    days = dRows.map((d) => ({
      id: d.id,
      day_index: d.day_index,
      date: d.date ?? null,
      capacity: d.capacity ?? null,
      entitlementIds: entByDay.get(d.id) ?? [],
    }));

    // Only fetch the heavy attendee/ledger data when there are days to show.
    if (days.length > 0) {
      const allEntIds = Array.from(new Set(days.flatMap((d) => d.entitlementIds)));

      const [regRes, ttEntRes, holdRes, redRes] = await Promise.all([
        db.from('registrations')
          .select('id, attendee_name, ticket_type_id, ticket_types(name)')
          .eq('event_id', id)
          .in('status', ['confirmed', 'checked_in', 'pending'])
          .order('attendee_name', { ascending: true })
          .limit(20000),
        allEntIds.length > 0
          ? db.from('ticket_type_entitlements').select('entitlement_id, ticket_type_id').in('entitlement_id', allEntIds)
          : Promise.resolve({ data: [], error: null }),
        allEntIds.length > 0
          ? db.from('entitlement_redemptions')
              .select('entitlement_id, registration_id, action')
              .eq('event_id', id)
              .in('action', ['granted', 'revoked', 'transferred'])
              .limit(20000)
          : Promise.resolve({ data: [], error: null }),
        allEntIds.length > 0
          ? db.from('entitlement_redemptions')
              .select('entitlement_id, registration_id, action, status, day_index')
              .eq('event_id', id)
              .in('action', ['redeemed', 'un_redeemed'])
              .not('day_index', 'is', null)
              .limit(20000)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const firstErr = regRes.error || ttEntRes.error || holdRes.error || redRes.error;
      if (firstErr) throw firstErr;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attendees = ((regRes.data ?? []) as any[]).map((r) => ({
        id: r.id,
        name: r.attendee_name ?? 'Attendee',
        ticketName: r.ticket_types?.name ?? null,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const regs = ((regRes.data ?? []) as any[]).map((r) => ({ id: r.id, ticket_type_id: r.ticket_type_id ?? null }));

      grid = computeAttendanceGrid(
        days,
        attendees,
        ttEntRes.data ?? [],
        regs,
        holdRes.data ?? [],
        redRes.data ?? [],
      );
    }
  } catch {
    loadError = true;
  }

  const dayCols = days.map((d) => ({ day_index: d.day_index, date: d.date, capacity: d.capacity }));

  return (
    <PageShell width="wide">
      <PageHeader
        title="Attendance by day"
        subtitle={`Who checked in on each day of ${event.name}. Green means scanned in that day, amber means entitled but absent, grey means not entitled that day.`}
      />

      <AttendanceGrid
        eventSlug={event.slug}
        days={dayCols}
        attendees={attendees}
        cells={grid.cells}
        perDay={grid.perDay}
        error={loadError}
      />
    </PageShell>
  );
}
