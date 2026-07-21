import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';
import { sendNotificationEmail } from '@/lib/email';
import {
  filterUnsubscribed,
  unsubscribeTableExists,
  unsubscribeUrl,
} from '@/lib/email/unsubscribe';

/**
 * Event-reminder cron. Runs on a schedule (see vercel.json `crons`) and, for
 * every registration on an event starting in the next 24h, fires a reminder
 * through notify() — so it reaches the attendee in-app + email + push at once.
 *
 * DEDUP IS ATOMIC. Every reminder — account-holder and guest alike — first
 * *claims* its registration row:
 *
 *     .update({ reminder_sent_at: now }).eq('id', …).is('reminder_sent_at', null).select('id')
 *
 * which returns a row only on the first transition. The previous read-then-
 * write ("select rows where reminder_sent_at is null", send, then update)
 * meant two overlapping invocations — a Vercel retry, or a manual GET landing
 * on top of the scheduled run — both saw the same null rows and both mailed
 * every attendee. On a 2,000-person event that is 2,000 duplicate emails and a
 * sender-reputation problem, not just an annoyance.
 *
 * If the send then fails, the claim is RELEASED so the next run retries rather
 * than silently marking a reminder delivered that never left the building.
 *
 * `reminder_sent_at` (migration 094) is probed once per run: where it is
 * missing the account-holder path falls back to the older notifications-table
 * check, so an unapplied migration degrades rather than breaks.
 *
 * Secured with CRON_SECRET when set (Vercel injects it as a Bearer token on
 * cron invocations). If unset, the route still runs (safe — it only sends
 * reminders that are due and not already sent).
 */

/** Hard ceiling per invocation. Without it a single large event can run the
 *  function past its timeout mid-loop; with atomic claims that is survivable
 *  (the next run resumes) but it still wants a bound. */
const MAX_PER_RUN = 500;
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
  let sendFailures = 0;
  let unsubscribedSkipped = 0;
  let capped = false;

  // Probe once: does the atomic-claim column exist (migration 094)?
  const claimColumn = await reminderColumnExists(admin);
  // Guest reminders go to addresses with no Eventera account, so
  // profiles.notification_prefs cannot gate them — the suppression list is the
  // ONLY opt-out they have. Skipping this check meant someone who clicked
  // Unsubscribe on an organizer broadcast still got mail from us.
  const unsubReady = await unsubscribeTableExists();

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

      const when = formatWhen(page.starts_at);
      const title = `${eventName} is coming up`;
      const body = `Your event starts ${when}. See you there!`;

      // 2) Registrations for this event that belong to an app user.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let regQuery = (admin as any)
        .from('registrations')
        .select('id, user_id')
        .eq('event_id', eventId)
        .not('user_id', 'is', null);
      // With the claim column present, filtering on it up front keeps the page
      // small; the claim below is still what guarantees single delivery.
      if (claimColumn) regQuery = regQuery.is('reminder_sent_at', null);
      const { data: regs } = await regQuery;

      // 3) Legacy fallback only: without the claim column, dedup by looking for
      //    an existing event_reminder notification row. Not race-safe — that is
      //    exactly why migration 094 matters.
      const remindedUserIds = new Set<string>();
      if (!claimColumn) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: already } = await (admin as any)
          .from('notifications')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('type', 'event_reminder');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of (already ?? []) as any[]) {
          if (r.user_id) remindedUserIds.add(r.user_id as string);
        }
      }

      // 4) One reminder per user, claimed atomically before it is sent.
      const notifiedUsers = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of (regs ?? []) as any[]) {
        if (remindersSent + guestRemindersSent >= MAX_PER_RUN) { capped = true; break; }
        const uid = r.user_id as string | null;
        if (!uid || remindedUserIds.has(uid)) continue;

        // A user with two registrations for the same event gets one reminder;
        // the extra rows are still claimed so they never resurface.
        const duplicateRow = notifiedUsers.has(uid);
        if (claimColumn && !(await claimRow(admin, r.id))) continue;
        if (duplicateRow) continue;
        notifiedUsers.add(uid);

        await notify({
          userId: uid,
          eventId,
          type: 'event_reminder',
          title,
          body,
          actionUrl: slug ? `/e/${slug}` : '/my-tickets',
        });
        remindersSent++;
      }
      if (capped) break;

      // 5) Guest (no-account) registrants — reach them by email only. notify()
      // can't (no user_id), so we email directly and dedup via reminder_sent_at.
      // Isolated in its own try/catch: if migration 094 hasn't been applied yet
      // (column missing → query errors), the account-holder reminders above
      // still succeed and the route never 500s.
      if (!claimColumn) continue;
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
        const guestRows = (guests ?? []) as any[];
        const suppressed = unsubReady
          ? await filterUnsubscribed(
              guestRows.map(g => (g.attendee_email as string | null) ?? '').filter(Boolean),
            )
          : new Set<string>();

        for (const g of guestRows) {
          if (remindersSent + guestRemindersSent >= MAX_PER_RUN) { capped = true; break; }
          const to = g.attendee_email as string | null;
          if (!to) continue;
          if (suppressed.has(to.trim().toLowerCase())) {
            // Claim it so we don't re-evaluate this row on every future run.
            await claimRow(admin, g.id);
            unsubscribedSkipped++;
            continue;
          }

          // Claim BEFORE sending: a concurrent run that loses this race sends
          // nothing rather than a second copy.
          if (!(await claimRow(admin, g.id))) continue;

          const ok = await sendNotificationEmail({
            to,
            title,
            body,
            actionUrl: slug ? `/e/${slug}` : undefined,
            unsubscribeUrl: unsubReady ? unsubscribeUrl(to, eventId) : undefined,
          });
          if (ok) {
            guestRemindersSent++;
          } else {
            // Release the claim — nothing was delivered, so the next run must
            // be free to try again instead of recording a phantom send.
            await releaseRow(admin, g.id);
            sendFailures++;
          }
        }
      } catch (guestErr) {
        // Swallow — column may not exist yet (migration 094). Account-holder
        // reminders already succeeded; skip guests until the column is present.
        console.warn('[reminders] guest reminder block skipped:', String(guestErr));
      }
      if (capped) break;
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'reminders failed', detail: String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    eventsChecked,
    remindersSent,
    guestRemindersSent,
    unsubscribedSkipped,
    sendFailures,
    capped,
    atomicDedup: claimColumn,
  });
}

/**
 * Atomically take ownership of one registration's reminder.
 *
 * The `.is('reminder_sent_at', null)` precondition lives in the UPDATE's WHERE
 * clause, so Postgres — not application code — arbitrates the race. `.select()`
 * returns the row only for the invocation that actually flipped it; everyone
 * else gets an empty array and backs off.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function claimRow(admin: any, id: string): Promise<boolean> {
  const { data, error } = await admin
    .from('registrations')
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq('id', id)
    .is('reminder_sent_at', null)
    .select('id');
  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

/** Undo a claim whose send failed, so the next run retries it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function releaseRow(admin: any, id: string): Promise<void> {
  await admin
    .from('registrations')
    .update({ reminder_sent_at: null })
    .eq('id', id);
}

/** Whether migration 094's `registrations.reminder_sent_at` is applied. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reminderColumnExists(admin: any): Promise<boolean> {
  try {
    const { error } = await admin
      .from('registrations')
      .select('reminder_sent_at')
      .limit(1);
    // 42703 = undefined_column
    return !error || error.code !== '42703';
  } catch {
    return false;
  }
}

function formatWhen(startsAt: string | null): string {
  if (!startsAt) return 'soon';
  const start = new Date(startsAt);
  const hours = Math.round((start.getTime() - Date.now()) / (60 * 60 * 1000));
  if (hours <= 1) return 'within the hour';
  if (hours < 24) return `in ${hours} hours`;
  return 'tomorrow';
}
