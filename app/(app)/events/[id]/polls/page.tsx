export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Gamification' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Trophy, ScanLine, CalendarDays, Network, MessageSquare, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props { params: Promise<{ id: string }> }

const MEDAL_COLORS = ['#E8C57E', '#B8C4CC', '#C8956B'];

const BOARD = [
  { name: 'Fatou Diop',       pts: 1240, badges: 7, grad: 'linear-gradient(135deg,#3E7E5E,#C9A45E)' },
  { name: 'Kwame Mensah',     pts: 1180, badges: 6, grad: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' },
  { name: 'Odunayo Eweniyi',  pts: 1090, badges: 6, grad: 'linear-gradient(135deg,#2A6A50,#C9A45E)' },
  { name: 'Tunde Kehinde',    pts: 960,  badges: 5, grad: 'linear-gradient(135deg,#163828,#3E7E5E)' },
  { name: 'Nia Williams',     pts: 880,  badges: 5, grad: 'linear-gradient(135deg,#163828,#2A6A50)' },
  { name: 'Yusuf Bello',      pts: 820,  badges: 4, grad: 'linear-gradient(135deg,#1F4D3A,#163828)' },
];

const RULES = [
  { label: 'Check in to the event',    pts: '+100', icon: ScanLine },
  { label: 'Attend a session',          pts: '+50',  icon: CalendarDays },
  { label: 'Make a connection',         pts: '+30',  icon: Network },
  { label: 'Ask a question',            pts: '+20',  icon: MessageSquare },
  { label: 'Share your Karta Card',     pts: '+150', icon: Share2 },
];

const BADGES = ['Early bird', 'Connector', 'Curious', 'Socialite', 'Night owl', 'Top 10'];

export default async function GamificationPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b" style={{ borderColor: '#E5E0D4' }}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 pt-3 pb-3 flex items-center justify-between gap-4">
          <Link href={`/events/${id}`} className="inline-flex items-center gap-1.5 text-[12px] hover:text-[#1F4D3A] transition-colors"
            style={{ color: '#6B7A72' }}>
            <ArrowLeft size={12} strokeWidth={2} />
            {event.name}
          </Link>
          <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium transition"
            style={{ background: '#1F4D3A', color: 'white' }}>
            Configure points
          </button>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>Gamification</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Points, badges & leaderboard.</p>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
          {/* Leaderboard */}
          <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
              <span className="font-display text-[14.5px] font-semibold" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Leaderboard</span>
            </div>
            <div className="divide-y" style={{ borderColor: '#E5E0D4' }}>
              {BOARD.map((b, i) => {
                const initials = b.name.split(' ').map(x => x[0]).join('');
                return (
                  <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
                    <span className="w-7 h-7 rounded-full grid place-items-center font-mono text-[12px] font-semibold shrink-0"
                      style={i < 3
                        ? { background: MEDAL_COLORS[i], color: '#163828' }
                        : { background: '#E8EFEB', color: '#6B7A72' }}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: b.grad }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{b.name}</div>
                      <div className="font-mono text-[10.5px] mt-0.5" style={{ color: '#6B7A72' }}>{b.badges} badges</div>
                    </div>
                    <span className="font-mono text-[15px]" style={{ color: '#1F4D3A' }}>{b.pts.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {/* Points rules */}
            <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
              <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                How points are earned
              </div>
              <div className="space-y-2.5">
                {RULES.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      <r.icon size={14} strokeWidth={1.8} />
                    </div>
                    <span className="flex-1 text-[13px]" style={{ color: '#3A4A42' }}>{r.label}</span>
                    <span className="font-mono text-[12.5px] font-medium" style={{ color: '#1F4D3A' }}>{r.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
              <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                Badges
              </div>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border"
                    style={{ background: 'rgba(232,197,126,0.15)', borderColor: 'rgba(232,197,126,0.4)', color: '#C9A45E' }}>
                    <Trophy size={11} strokeWidth={2} />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
