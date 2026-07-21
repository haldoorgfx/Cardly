export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Team' };
}

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMyTeam, getTeamMembers, getTeamInvites, createTeam } from '@/lib/teams/queries';
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

  // Only downgrade if subscription explicitly failed/cancelled.
  // This correctly handles manually-assigned plans with no Stripe subscription.
  const subscriptionFailed =
    profile?.subscription_status === 'canceled' ||
    profile?.subscription_status === 'past_due';
  const plan =
    subscriptionFailed && profile?.plan !== 'free' ? 'free' : (profile?.plan ?? 'free');
  const isStudio = plan === 'studio';

  let members: Awaited<ReturnType<typeof getTeamMembers>> = [];
  let invites: Awaited<ReturnType<typeof getTeamInvites>> = [];

  // Resolve membership FIRST, independent of plan. An invited teammate is
  // billed nothing and is almost always on the free plan — gating this lookup
  // on `isStudio` meant every member who accepted an invite landed back here
  // and saw the "Upgrade to Studio" upsell instead of the team they had just
  // joined, with no way to see who else was on it or to leave.
  let team = await getMyTeam(user.id);

  // Auto-provision a team for a Studio owner who doesn't have one yet, so the
  // page shows a working "Invite member" control (and the owner as a member)
  // instead of a dead-end empty state that says "invite" with no button.
  if (!team && isStudio) {
    try {
      team = await createTeam(user.id, profile?.full_name?.trim() || 'My Team');
    } catch {
      team = null;
    }
  }

  if (team) {
    [members, invites] = await Promise.all([
      getTeamMembers(team.id),
      getTeamInvites(team.id),
    ]);
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
