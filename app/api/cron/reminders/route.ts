import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';

/**
 * Event-reminder cron. Runs on a schedule (see vercel.json `crons`) and, for
 * every registration on an event starting in the next 24h, fires a reminder
 * through notify() — so it reaches the attendee in-app + email + push at once.
 *
 * Dedup without a migration: a reminder is only sent to a user who doesn't
 * already have an `event_reminder` notification row for that event. notify()
 * creates that row, so the next run skips them.
 *
 * Secured with CRON_SECRET when set (Vercel injects it as a Bearer token on
 * cron invocations). If unset, the route still runs (safe — it only sends
 * reminders that are due and not already sent).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let eventsChecked = 0;
  let remindersSent = 0;
  let guestRemindersSent = 0;

  try {
    // 1) Events starting within the next 24h (published only).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pages } = await (admin as any)
      .from('event_pages')
      .select('event_id, title, starts_at, events!inner(id, slug, name, status)')
      .eq('events.status', 'published')
      .gte('starts_at', now.toISOString())
      .lte('starts_at', windowEnd.toISOString());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const page of (pages ?? []) as any[]) {
      const eventId: string = page.event_id;
      const eventName: string =
        page.title || page.events?.name || 'your event';
      const slug: string | null = page.events?.slug ?? null;
      if (!eventId) continue;
      eventsChecked++;

      // 2) Registrations for this event that belong to an app user.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: regs } = await (admin as any)
        .from('registrations')
        .select('user_id')
        .eq('event_id', eventId)
        .not('user_id', 'is', null);
      if (!regs || regs.length === 0) continue;

      // 3) Who's already been reminded for this event.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: already } = await (admin as any)
        .from('notifications')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('type', 'event_reminder');
      const remindedUserIds = new Set<string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (already ?? []).map((r: any) => r.user_id as string),
      );

      // 4) Unique, not-yet-reminded users → reminder via notify().
      const targets = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of regs as any[]) {
        const uid = r.user_id as string | null;
        if (uid && !remindedUserIds.has(uid)) targets.add(uid);
      }

      const when = formatWhen(page.starts_at);
      for (const uid of Array.from(targets)) {
        await notify({
          userId: uid,
          eventId,
          type: 'event_reminder',
          title: `${eventName} is coming up`,
          body: `Your event starts ${when}. See you there!`,
          actionUrl: slug ? `/e/${slug}` : '/my-tickets',
        });
        remindersSent++;
      }

      // 5) Guest (no-account) registrants — reach them by email only. notify()
      // can't (no user_id), so we email directly and dedup via reminder_sent_at.
      // Isolated in its own try/catch: if migration 094 hasn't been applied yet
      // (column missing → query errors), the account-holder reminders above
      // still succeed and the route never 500s.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: guests, error: guestErr } = await (admin as any)
          .from('registrations')
          .select('id, attendee_email, attendee_name')
          .eq('event_id', eventId)
          .is('user_id', null)
          .in('status', ['confirmed', 'checked_in'])
          .is('reminder_sent_at', null);
        if (guestErr) throw guestErr;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const g of (guests ?? []) as any[]) {
          const to = g.attendee_email as string | null;
          if (!to) continue;
          await sendNotificationEmail({
            to,
            title: `${eventName} is coming up`,
            body: `Your event starts ${when}. See you there!`,
            actionUrl: slug ? `/e/${slug}` : undefined,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any)
            .from('registrations')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', g.id);
          guestRemindersSent++;
        }
      } catch (guestErr) {
        // Swallow — column may not exist yet (migration 094). Account-holder
        // reminders already succeeded; skip guests until the column is present.
        console.warn('[reminders] guest reminder block skipped:', String(guestErr));
      }
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'reminders failed', detail: String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, eventsChecked, remindersSent, guestRemindersSent });
}

function formatWhen(startsAt: string | null): string {
  if (!startsAt) return 'soon';
  const start = new Date(startsAt);
  const hours = Math.round((start.getTime() - Date.now()) / (60 * 60 * 1000));
  if (hours <= 1) return 'within the hour';
  if (hours < 24) return `in ${hours} hours`;
  return 'tomorrow';
}
