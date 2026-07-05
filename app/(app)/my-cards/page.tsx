export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IdCard, Download, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Eventera Cards' };

type CardRow = {
  id: string;
  attendee_name: string;
  eventera_card_url: string | null;
  created_at: string;
  events: { id: string; name: string; slug: string } | null;
};

export default async function MyCardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/my-cards');

  const admin = createAdminClient();
  // Same identity matching as /my-tickets: by user_id or the account email.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regs } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, eventera_card_url, created_at, events(id, name, slug)')
    .or(`attendee_email.eq.${(user.email ?? '').toLowerCase()},user_id.eq.${user.id}`)
    .in('status', ['confirmed', 'checked_in', 'pending', 'pending_approval'])
    .not('eventera_card_url', 'is', null)
    .order('created_at', { ascending: false });

  const cards = (regs ?? []) as CardRow[];

  return (
    <div className="max-w-[900px] mx-auto px-5 py-10">
      <div className="mb-8">
        <h1 className="font-display font-normal text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
          My Eventera Cards
        </h1>
        <p className="text-[15px] mt-2" style={{ color: '#6B7A72' }}>
          {cards.length} card{cards.length !== 1 ? 's' : ''} collected
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <span className="inline-grid place-items-center w-11 h-11 rounded-xl mb-3" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
            <IdCard size={20} strokeWidth={1.8} />
          </span>
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            No cards yet. When you register for an event and personalize your Eventera Card, it appears here.
          </p>
          <Link href="/my-tickets" className="inline-flex items-center gap-1.5 mt-4 text-[13px] font-medium" style={{ color: '#1F4D3A' }}>
            Go to my tickets <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c) => (
            <div key={c.id} className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #E5E0D4' }}>
              <div className="relative" style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}>
                {c.eventera_card_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.eventera_card_url} alt={`Eventera Card — ${c.events?.name ?? ''}`} className="absolute inset-0 w-full h-full object-contain" />
                )}
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>{c.events?.name ?? 'Event'}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{c.attendee_name}</div>
                </div>
                {c.eventera_card_url && (
                  <a
                    href={c.eventera_card_url}
                    download
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition hover:opacity-75 shrink-0"
                    style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                  >
                    <Download size={13} strokeWidth={2} /> Download
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
