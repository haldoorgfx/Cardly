export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { getUserPlan } from '@/lib/billing/can';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

interface Props { params: Promise<{ id: string }> }

interface LeaderboardEntry { rank: number; registration_id: string; attendee_name: string; total_points: number }

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default async function GamificationPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Plan gate — Gamification is a Pro feature (minPlan: 'pro' in event overview ACTION_CARDS)
  const plan = await getUserPlan(user.id);
  if (PLAN_RANK[plan] < PLAN_RANK.pro) redirect(`/events/${_ev.slug}`);

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  // Aggregate points per registration — mirrors app/api/events/[id]/leaderboard/route.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('leaderboard_points')
    .select('registration_id, points')
    .eq('event_id', id);

  const totals = new Map<string, number>();
  for (const r of (rows ?? [])) {
    totals.set(r.registration_id, (totals.get(r.registration_id) ?? 0) + r.points);
  }

  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 50);
  const ids = sorted.map(([rid]) => rid);
  const { data: regs } = ids.length
    ? await admin.from('registrations').select('id, attendee_name').in('id', ids)
    : { data: [] };

  const nameMap = new Map((regs ?? []).map(r => [r.id, r.attendee_name]));
  const leaderboard: LeaderboardEntry[] = sorted.map(([rid, pts], i) => ({
    rank: i + 1,
    registration_id: rid,
    attendee_name: nameMap.get(rid) ?? 'Attendee',
    total_points: pts,
  }));

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <>
      <div className="sticky top-0 z-30 border-b bg-white" style={{ borderColor: '#E5E0D4' }}>
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">
          <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1 text-[12px] text-[#6B7A72] hover:text-[#1F4D3A] transition-colors">
            <ArrowLeft size={12} strokeWidth={2} />
            {event.name}
          </Link>
        </div>
      </div>

      <PageShell width="wide">
        <PageHeader eyebrow="Engagement" title="Gamification" subtitle={<>Points attendees earn across Q&amp;A, polls, and messages.</>} />

        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #E5E0D4' }}>
            <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
              <svg width={22} height={22} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </div>
            <h3 className="font-display text-[16px] font-semibold mb-2" style={{ color: '#0F1F18' }}>No points yet</h3>
            <p className="text-[13px] max-w-[400px] mx-auto" style={{ color: '#6B7A72' }}>
              Attendees earn points by asking questions, voting in polls, and joining the conversation. The leaderboard fills up once your event goes live.
            </p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-8">
                {[top3[1], top3[0], top3[2]].map((entry, i) => {
                  if (!entry) return <div key={i} className="w-24" />;
                  const isFirst = entry.rank === 1;
                  const size = isFirst ? 72 : 56;
                  return (
                    <div key={entry.registration_id} className="flex flex-col items-center gap-2">
                      {isFirst && <span style={{ color: '#E8C57E', fontSize: 20 }}>★</span>}
                      <div
                        className="rounded-full flex items-center justify-center font-display font-semibold text-white"
                        style={{ width: size, height: size, background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)', border: isFirst ? '2px solid #E8C57E' : 'none', fontSize: isFirst ? 22 : 17 }}
                      >
                        {initials(entry.attendee_name)}
                      </div>
                      <div className="text-center">
                        <div className="font-display font-medium text-[13px] truncate max-w-[80px]" style={{ color: '#0F1F18' }}>{entry.attendee_name.split(' ')[0]}</div>
                        <div className="text-[13px] font-semibold" style={{ color: isFirst ? '#E8C57E' : '#1F4D3A' }}>{entry.total_points}pts</div>
                        <div className="text-[12.5px]" style={{ color: '#6B7A72' }}>#{entry.rank}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ranks 4+ */}
            {rest.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                {rest.map((entry, i) => (
                  <div key={entry.registration_id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < rest.length - 1 ? '1px solid #F0EBE3' : 'none' }}>
                    <span className="text-[13px] w-8" style={{ color: '#6B7A72' }}>#{entry.rank}</span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-display font-semibold shrink-0" style={{ background: '#1F4D3A' }}>{initials(entry.attendee_name)}</div>
                    <span className="flex-1 text-[14px] font-medium" style={{ color: '#0F1F18' }}>{entry.attendee_name}</span>
                    <span className="text-[14px] font-semibold" style={{ color: '#0F1F18' }}>{entry.total_points}pts</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </PageShell>
    </>
  );
}
