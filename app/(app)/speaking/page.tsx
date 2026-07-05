export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUserRoles, eventsWithRole } from '@/lib/rbac/roles';
import { Mic, CalendarDays, MapPin, ArrowRight, Clock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Speaking' };

type SessionRow = {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  room: string | null;
};

type EventGroup = {
  eventId: string;
  eventName: string;
  eventSlug: string;
  speakerId: string | null;
  sessions: SessionRow[];
};

// A CFP the viewer can submit to (open on an event they speak at).
type OpenCfp = {
  eventId: string;
  eventName: string;
  eventSlug: string;
  deadlineAt: string | null;
};

// One of the viewer's own abstract submissions.
type MySubmission = {
  id: string;
  eventId: string;
  title: string;
  eventName: string;
  status: string;
  submittedAt: string | null;
};

const SUB_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  accept: 'Accepted',
  reject: 'Declined',
  revision: 'Revision',
  waitlist: 'Waitlisted',
};

const SUB_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#F5F5F0', color: '#6B7A72' },
  accept: { bg: '#E8EFEB', color: '#1F4D3A' },
  reject: { bg: 'rgba(184,66,60,0.1)', color: '#B8423C' },
  revision: { bg: '#FEF3C7', color: '#C97A2D' },
  waitlist: { bg: '#E8EFEB', color: '#6B7A72' },
};

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 86400000));
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default async function SpeakingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/speaking');

  const roles = await getUserRoles(user.id);
  const roleEventIds = eventsWithRole(roles, 'speaker');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: profile } = await db
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();
  const email = (profile?.email as string | undefined)?.toLowerCase() ?? '';

  // Resolve speaker rows two ways: by matching email, and via the events where
  // the account holds an active 'speaker' role. Merge both so nothing is missed.
  const [byEmailRes, byEventRes] = await Promise.all([
    email
      ? db.from('speakers').select('id, name, event_id').ilike('email', email)
      : Promise.resolve({ data: [] }),
    roleEventIds.length > 0
      ? db.from('speakers').select('id, name, event_id').in('event_id', roleEventIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Prefer email-matched speaker rows (they're the actual person); fall back to
  // any speaker row on a role event so the section still renders.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speakerRows: any[] = [];
  const seenSpeakerIds = new Set<string>();
  for (const row of [...((byEmailRes?.data) ?? []), ...((byEventRes?.data) ?? [])]) {
    if (!seenSpeakerIds.has(row.id)) { seenSpeakerIds.add(row.id); speakerRows.push(row); }
  }

  // Collect every relevant event id (from speaker rows + role events).
  const eventIds = Array.from(new Set([
    ...speakerRows.map(s => s.event_id as string),
    ...roleEventIds,
  ]));

  let groups: EventGroup[] = [];

  if (eventIds.length > 0) {
    const { data: events } = await db
      .from('events')
      .select('id, name, slug')
      .in('id', eventIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventById = new Map<string, any>(((events as any[]) ?? []).map(e => [e.id, e]));

    // Sessions this account speaks at, resolved via session_speakers → sessions.
    const speakerIds = speakerRows.map(s => s.id as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sessionRows: any[] = [];
    if (speakerIds.length > 0) {
      const { data: links } = await db
        .from('session_speakers')
        .select('session_id, speaker_id')
        .in('speaker_id', speakerIds);
      const sessionIds = Array.from(new Set(((links ?? [])).map((l: { session_id: string }) => l.session_id)));
      if (sessionIds.length > 0) {
        const { data: sess } = await db
          .from('sessions')
          .select('id, event_id, title, starts_at, ends_at, room')
          .in('id', sessionIds)
          .order('starts_at', { ascending: true });
        sessionRows = sess ?? [];
      }
    }

    // Group by event.
    const sessionsByEvent = new Map<string, SessionRow[]>();
    for (const s of sessionRows) {
      const arr = sessionsByEvent.get(s.event_id) ?? [];
      arr.push({ id: s.id, title: s.title, starts_at: s.starts_at, ends_at: s.ends_at, room: s.room });
      sessionsByEvent.set(s.event_id, arr);
    }

    const speakerByEvent = new Map<string, string>();
    for (const sp of speakerRows) speakerByEvent.set(sp.event_id, sp.id);

    groups = eventIds
      .filter(id => eventById.has(id))
      .map(id => {
        const ev = eventById.get(id);
        return {
          eventId: id,
          eventName: ev.name as string,
          eventSlug: ev.slug as string,
          speakerId: speakerByEvent.get(id) ?? null,
          sessions: sessionsByEvent.get(id) ?? [],
        };
      });
  }

  // ── Call for papers ──────────────────────────────────────────────────────
  // Open CFPs on events the viewer speaks at, plus the viewer's own submissions.
  // Submissions carry no account FK — identity lives in authors_json[].email —
  // so we match on the same profile email used to resolve the speaker above.
  const eventById = new Map<string, { name: string; slug: string }>();
  for (const g of groups) eventById.set(g.eventId, { name: g.eventName, slug: g.eventSlug });

  let openCfps: OpenCfp[] = [];
  const mySubmissions: MySubmission[] = [];

  if (eventIds.length > 0) {
    // Ensure we have name/slug for every relevant event. `groups` only covers
    // events that produced a speaker group; an event may have an open CFP without
    // one, so fill any gaps directly from `events`.
    const missing = eventIds.filter(id => !eventById.has(id));
    if (missing.length > 0) {
      const { data: evs } = await db.from('events').select('id, name, slug').in('id', missing);
      for (const e of (evs ?? [])) eventById.set(e.id, { name: e.name, slug: e.slug });
    }

    const [cfpRes, absRes] = await Promise.all([
      db.from('call_for_papers')
        .select('event_id, is_open, deadline_at')
        .in('event_id', eventIds)
        .eq('is_open', true),
      db.from('abstracts')
        .select('id, event_id, title, status, authors_json, submitted_at')
        .in('event_id', eventIds)
        .order('submitted_at', { ascending: false }),
    ]);

    for (const c of (cfpRes?.data ?? [])) {
      const ev = eventById.get(c.event_id);
      if (!ev) continue;
      openCfps.push({ eventId: c.event_id, eventName: ev.name, eventSlug: ev.slug, deadlineAt: c.deadline_at ?? null });
    }

    // Keep only submissions where the viewer is an author (by email match).
    for (const a of (absRes?.data ?? [])) {
      const authors = Array.isArray(a.authors_json) ? a.authors_json : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mine = email && authors.some((au: any) => (au?.email ?? '').toLowerCase() === email);
      if (!mine) continue;
      const ev = eventById.get(a.event_id);
      mySubmissions.push({
        id: a.id,
        eventId: a.event_id,
        title: a.title,
        eventName: ev?.name ?? 'Event',
        status: a.status ?? 'pending',
        submittedAt: a.submitted_at ?? null,
      });
    }
  }

  // Don't offer a fresh submission for an event the viewer has already submitted to.
  const submittedEventIds = new Set(mySubmissions.map(s => s.eventId));
  openCfps = openCfps.filter(c => !submittedEventIds.has(c.eventId));

  const hasCfpActivity = openCfps.length > 0 || mySubmissions.length > 0;
  const isEmpty = groups.length === 0 && !hasCfpActivity;

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        <div className="mb-8">
          <h1 className="font-display text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em]" style={{ color: '#1F4D3A' }}>
            Speaking
          </h1>
          <p className="mt-2 text-[14px] sm:text-[15px]" style={{ color: '#6B7A72' }}>
            The events you speak at and your sessions.
          </p>
        </div>

        {isEmpty ? (
          <div className="bg-white rounded-2xl border p-8 sm:p-10 text-center"
            style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="inline-grid place-items-center w-14 h-14 rounded-2xl mb-5"
              style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Mic size={26} strokeWidth={1.7} />
            </div>
            <h2 className="font-display text-[20px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
              No speaking engagements yet
            </h2>
            <p className="mt-2 text-[14px] max-w-[420px] mx-auto leading-[1.6]" style={{ color: '#6B7A72' }}>
              When an organizer adds you as a speaker, or opens a call for papers on an
              event you speak at, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.length > 0 && groups.map(group => (
              <section key={group.eventId} className="bg-white rounded-2xl border overflow-hidden"
                style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4"
                  style={{ borderBottom: '1px solid #E5E0D4' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
                      style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      <CalendarDays size={16} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-[15px] font-semibold truncate" style={{ color: '#0F1F18' }}>
                        {group.eventName}
                      </div>
                      <div className="text-[12px]" style={{ color: '#6B7A72' }}>
                        {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  {group.speakerId && (
                    <Link href={`/s/${group.eventSlug}/${group.speakerId}`}
                      className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-medium transition hover:text-[#163828]"
                      style={{ color: '#1F4D3A' }}>
                      Speaker profile
                      <ArrowRight size={13} strokeWidth={2} />
                    </Link>
                  )}
                </div>

                {group.sessions.length === 0 ? (
                  <div className="px-5 sm:px-6 py-6 text-[13.5px]" style={{ color: '#6B7A72' }}>
                    No sessions scheduled yet.
                  </div>
                ) : (
                  <ul>
                    {group.sessions.map(s => (
                      <li key={s.id} className="px-5 sm:px-6 py-4 flex items-start gap-3 border-t first:border-t-0"
                        style={{ borderColor: '#F0EDE6' }}>
                        <span className="grid place-items-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                          style={{ background: '#FAF6EE', color: '#1F4D3A', border: '1px solid #E5E0D4' }}>
                          <Mic size={14} strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{s.title}</div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[12.5px]" style={{ color: '#6B7A72' }}>
                            {s.starts_at && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock size={12} strokeWidth={1.9} /> {fmtTime(s.starts_at)}
                              </span>
                            )}
                            {s.room && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin size={12} strokeWidth={1.9} /> {s.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {hasCfpActivity && (
              <section className="bg-white rounded-2xl border overflow-hidden"
                style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-center gap-3 px-5 sm:px-6 py-4"
                  style={{ borderBottom: '1px solid #E5E0D4' }}>
                  <span className="grid place-items-center w-9 h-9 rounded-lg shrink-0"
                    style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <FileText size={16} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
                      Call for papers
                    </div>
                    <div className="text-[12px]" style={{ color: '#6B7A72' }}>
                      Submit a talk proposal and track its status.
                    </div>
                  </div>
                </div>

                {/* Open CFPs the viewer can submit to */}
                {openCfps.length > 0 && (
                  <ul>
                    {openCfps.map(cfp => {
                      const dLeft = daysUntil(cfp.deadlineAt);
                      return (
                        <li key={cfp.eventId}
                          className="px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t first:border-t-0"
                          style={{ borderColor: '#F0EDE6' }}>
                          <div className="min-w-0">
                            <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{cfp.eventName}</div>
                            <div className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>
                              {cfp.deadlineAt
                                ? <>Deadline {fmtDate(cfp.deadlineAt)}{dLeft !== null && dLeft > 0 ? ` · ${dLeft} day${dLeft !== 1 ? 's' : ''} left` : ''}</>
                                : 'Submissions open'}
                            </div>
                          </div>
                          <Link href={`/e/${cfp.eventSlug}/cfp`}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                            style={{ background: '#1F4D3A' }}>
                            Submit abstract
                            <ArrowRight size={13} strokeWidth={2} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* The viewer's own submissions */}
                {mySubmissions.length > 0 && (
                  <div>
                    <div className="px-5 sm:px-6 pt-4 pb-2 text-[12px] font-medium uppercase tracking-wide border-t"
                      style={{ color: '#6B7A72', borderColor: '#F0EDE6' }}>
                      Your submissions
                    </div>
                    <ul>
                      {mySubmissions.map(sub => {
                        const label = SUB_STATUS_LABEL[sub.status] ?? sub.status;
                        const style = SUB_STATUS_STYLE[sub.status] ?? SUB_STATUS_STYLE.pending;
                        return (
                          <li key={sub.id}
                            className="px-5 sm:px-6 py-4 flex items-start gap-3 border-t"
                            style={{ borderColor: '#F0EDE6' }}>
                            <span className="grid place-items-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                              style={{ background: '#FAF6EE', color: '#1F4D3A', border: '1px solid #E5E0D4' }}>
                              <CheckCircle2 size={14} strokeWidth={1.8} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{sub.title}</div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-[12.5px]" style={{ color: '#6B7A72' }}>
                                <span className="truncate">{sub.eventName}</span>
                                {sub.submittedAt && <span>· Submitted {fmtDate(sub.submittedAt)}</span>}
                              </div>
                            </div>
                            <span className="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium"
                              style={{ background: style.bg, color: style.color }}>
                              {label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
