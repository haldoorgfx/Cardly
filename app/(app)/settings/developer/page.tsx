export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Developer — Settings' };

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DeveloperTab } from '@/app/(app)/settings/DeveloperTab';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';
import { getUserPlan } from '@/lib/billing/can';

export default async function DeveloperPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPlatformFeatureEnabled('developer_api'))) redirect('/settings');

  // Canonical plan helper — a raw `profiles.plan` read (what this used to do)
  // ignores `subscription_status` and the period-end backstop, so a
  // cancelled/past-due/never-paid Studio account still saw the full API
  // keys + webhooks panel here even though every route underneath (POST
  // /api/keys, POST /api/webhooks, authenticateApiKey) uses getUserPlan and
  // would reject it with 402. Same class of bug as the other plan-gating
  // fixes in this codebase — align the display with what's actually enforced.
  const plan = await getUserPlan(user.id);

  return (
    <div className="max-w-[760px] mx-auto">
      <DeveloperTab plan={plan} />
    </div>
  );
}
