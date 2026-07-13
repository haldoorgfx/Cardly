export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingWizard from '@/components/account/OnboardingWizard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Set up your feed' };

export default async function AccountSetupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/account/setup');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_done, full_name, city, phone, avatar_url')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_done) redirect('/my-tickets');

  // Local shape — profiles columns added in migration 048 may not yet be in the
  // shared generated types (owned by another agent), so we read narrowly here.
  const p = profile as {
    full_name?: string | null;
    city?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Minimal nav */}
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <div className="font-semibold text-[19px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18', letterSpacing: '-0.01em' }}>
          Eventer<span style={{ color: '#E8C57E' }}>a</span>
        </div>
        <span className="text-[13px]" style={{ color: '#3A4A42' }}>{user.email}</span>
      </nav>

      <div className="max-w-[620px] mx-auto px-5 pb-24">
        <OnboardingWizard
          userId={user.id}
          userEmail={user.email ?? ''}
          userName={p?.full_name ?? user.user_metadata?.full_name ?? ''}
          city={p?.city ?? ''}
          phone={p?.phone ?? ''}
          avatarUrl={p?.avatar_url ?? ''}
        />
      </div>
    </div>
  );
}
