export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props { params: Promise<{ id: string }> }

export default async function GamificationPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className=" text-[10px] tracking-[0.22em] uppercase mb-2" style={{ color: '#6B7A72' }}>Engagement</div>
        <h1 className="font-display font-bold text-[28px] tracking-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Gamification</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: '#6B7A72' }}>Drive participation with points, leaderboards, and challenges.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #E5E0D4' }}>
        <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
          <svg width={22} height={22} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
          </svg>
        </div>
        <h3 className="font-display text-[16px] font-semibold mb-2" style={{ color: '#0F1F18' }}>Gamification coming soon</h3>
        <p className="text-[13px] max-w-[400px] mx-auto" style={{ color: '#6B7A72' }}>
          Reward attendee participation with points, badges, and leaderboards. Keep energy high from first session to last.
        </p>
      </div>
    </div>
  );
}
