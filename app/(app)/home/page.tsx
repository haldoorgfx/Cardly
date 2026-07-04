export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getVisibleSections } from '@/lib/rbac/sections';
import { Ticket, Mic, Briefcase, LayoutGrid, ShieldCheck, Compass, ArrowRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Home' };

type Hat = {
  key: string;
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
};

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sections = await getVisibleSections(user.id);

  const hats: Hat[] = [];
  if (sections.tickets) {
    hats.push({
      key: 'tickets',
      label: 'My tickets & agenda',
      desc: 'Your registrations, Eventera Cards, and personal agenda.',
      href: '/my-tickets',
      icon: <Ticket size={20} strokeWidth={1.8} />,
    });
  }
  if (sections.speaking) {
    hats.push({
      key: 'speaking',
      label: 'Speaking',
      desc: 'Sessions you present, with times and rooms.',
      href: '/speaking',
      icon: <Mic size={20} strokeWidth={1.8} />,
    });
  }
  if (sections.sponsoring) {
    hats.push({
      key: 'sponsoring',
      label: 'Sponsoring',
      desc: 'Your booths, leads, and exhibitor resources.',
      href: '/sponsoring',
      icon: <Briefcase size={20} strokeWidth={1.8} />,
    });
  }
  if (sections.organizing) {
    hats.push({
      key: 'organizing',
      label: 'Organizing',
      desc: 'Everything you run — events, registrations, revenue.',
      href: '/dashboard',
      icon: <LayoutGrid size={20} strokeWidth={1.8} />,
    });
  }
  if (sections.admin) {
    hats.push({
      key: 'admin',
      label: 'Admin',
      desc: 'Platform stats, accounts, and revenue.',
      href: '/admin/analytics',
      icon: <ShieldCheck size={20} strokeWidth={1.8} />,
    });
  }

  const isEmpty = hats.length === 0;

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        <div className="mb-8">
          <h1 className="font-display text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em]" style={{ color: '#1F4D3A' }}>
            Home
          </h1>
          <p className="mt-2 text-[14px] sm:text-[15px]" style={{ color: '#6B7A72' }}>
            {isEmpty
              ? 'Discover events near you and pick up your first ticket.'
              : 'Everything you do on Eventera, in one place.'}
          </p>
        </div>

        {isEmpty ? (
          <div className="bg-white rounded-2xl border p-8 sm:p-10 text-center"
            style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="inline-grid place-items-center w-14 h-14 rounded-2xl mb-5"
              style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Compass size={26} strokeWidth={1.7} />
            </div>
            <h2 className="font-display text-[20px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
              Nothing here yet
            </h2>
            <p className="mt-2 text-[14px] max-w-[420px] mx-auto leading-[1.6]" style={{ color: '#6B7A72' }}>
              Once you register for an event, speak at one, or sponsor one, it&apos;ll show up here.
            </p>
            <Link href="/discover"
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-white text-[14px] font-medium transition hover:bg-[#163828]"
              style={{ background: '#1F4D3A' }}>
              Discover events
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {hats.map(hat => (
              <Link key={hat.key} href={hat.href}
                className="group bg-white rounded-2xl border p-5 sm:p-6 flex flex-col transition-colors hover:border-[#1F4D3A]/40"
                style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-start justify-between mb-4">
                  <span className="grid place-items-center w-11 h-11 rounded-xl shrink-0"
                    style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {hat.icon}
                  </span>
                  <ArrowRight size={16} strokeWidth={2}
                    className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                    style={{ color: '#1F4D3A' }} />
                </div>
                <div className="font-display text-[16px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
                  {hat.label}
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.55]" style={{ color: '#6B7A72' }}>
                  {hat.desc}
                </p>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
