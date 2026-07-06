export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'White Label — Settings' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WhiteLabelTab } from '@/app/(app)/settings/WhiteLabelTab';

export default async function WhiteLabelPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = profile?.plan ?? 'free';

  return (
    <>
      <div className=" max-w-[760px] mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-semibold text-[24px] tracking-tight" style={{ color: '#0F1F18' }}>White Label</h1>
          <p className="mt-1 text-[14px]" style={{ color: '#6B7A72' }}>Remove Eventera branding and use your own domain.</p>
        </div>
        <WhiteLabelTab plan={plan} />
      </div>
    </>
  );
}
