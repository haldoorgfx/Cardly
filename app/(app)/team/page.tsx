export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMyTeam, getTeamMembers, getTeamInvites } from '@/lib/teams/queries';
import { TeamClient } from './TeamClient';

export default async function TeamPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, plan, subscription_status')
    .eq('id', user.id)
    .single();

  // Honor plan if: active subscription, trialing, OR manually assigned (no subscription yet).
  // !subscription_status covers null, undefined, and '' (empty string).
  const isActivePaid =
    profile?.subscription_status === 'active' ||
    profile?.subscription_status === 'trialing' ||
    !profile?.subscription_status;
  const plan =
    !isActivePaid && profile?.plan !== 'free' ? 'free' : (profile?.plan ?? 'free');
  const isStudio = plan === 'studio';

  let team = null;
  let members: Awaited<ReturnType<typeof getTeamMembers>> = [];
  let invites: Awaited<ReturnType<typeof getTeamInvites>> = [];

  if (isStudio) {
    team = await getMyTeam(user.id);
    if (team) {
      [members, invites] = await Promise.all([
        getTeamMembers(team.id),
        getTeamInvites(team.id),
      ]);
    }
  }

  return (
    <TeamClient
      userId={user.id}
      userEmail={profile?.email ?? user.email ?? ''}
      userName={profile?.full_name ?? null}
      plan={plan as 'free' | 'pro' | 'studio'}
      team={team}
      members={members}
      invites={invites}
    />
  );
}
