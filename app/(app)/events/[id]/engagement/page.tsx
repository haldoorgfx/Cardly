export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Engagement' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, BarChart2, Users2, ArrowLeft } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

export default async function EngagementPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  const features = [
    {
      label: 'Q&A',
      icon: <MessageSquare size={20} strokeWidth={1.7} />,
      desc: 'Live questions from attendees — upvote, answer, and moderate in real time.',
      href: `/events/${id}/q-and-a`,
    },
    {
      label: 'Polls',
      icon: <BarChart2 size={20} strokeWidth={1.7} />,
      desc: 'Real-time audience polls to drive participation during sessions.',
      href: `/events/${id}/polls`,
    },
    {
      label: 'Networking',
      icon: <Users2 size={20} strokeWidth={1.7} />,
      desc: 'Attendee connections, match suggestions, and messaging.',
      href: `/events/${id}/q-and-a`,
    },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="sticky top-0 z-30 border-b bg-white" style={{ borderColor: '#E5E0D4' }}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 pt-3 pb-3">
          <Link href={`/events/${id}`} className="inline-flex items-center gap-1 text-[12px] text-[#6B7A72] hover:text-[#1F4D3A] transition-colors">
            <ArrowLeft size={12} strokeWidth={2} />
            {event.name}
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Engagement
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Drive audience participation — Q&A, polls, and networking.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(card => (
            <Link key={card.label} href={card.href}
              className="group text-left bg-white rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:border-[#1F4D3A]/40"
              style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)', color: 'inherit', textDecoration: 'none' }}>
              <div className="w-10 h-10 rounded-xl grid place-items-center mb-3" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                {card.icon}
              </div>
              <div className="font-display text-[15px] font-semibold tracking-tight text-[#0F1F18]">{card.label}</div>
              <p className="text-[13px] mt-1 leading-[1.5] text-[#6B7A72]">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
