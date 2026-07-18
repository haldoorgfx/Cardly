import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export const metadata = { title: 'Get started' };

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Already onboarded? Don't show the wizard again — re-running "Finish" inserts
  // a fresh draft event + event_pages row every time, silently duplicating.
  // `onboarding_completed` is written via the admin client and isn't in the
  // generated types yet — cast to read it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.onboarding_completed) redirect('/dashboard');

  return <OnboardingClient />;
}
