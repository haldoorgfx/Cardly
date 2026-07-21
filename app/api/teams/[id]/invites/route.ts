import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getMyTeam, getTeamMembers, getTeamInvites, createInvite } from '@/lib/teams/queries';
import { PLANS } from '@/lib/billing/plans';
import { sendTeamInviteEmail } from '@/lib/email';

// POST /api/teams/[id]/invites — send an invite
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await getMyTeam(user.id);
  if (!team || team.id !== params.id) {
    return NextResponse.json({ error: 'Not your team.' }, { status: 403 });
  }

  // Only the owner or an admin member may invite (inviting consumes paid seats)
  const members = await getTeamMembers(params.id);
  const me = members.find(m => m.user_id === user.id);
  const isOwnerOrAdmin = team.owner_id === user.id || me?.role === 'owner' || me?.role === 'admin';
  if (!isOwnerOrAdmin) {
    return NextResponse.json({ error: 'Only team admins can invite members.' }, { status: 403 });
  }

  const { email, role = 'member' } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  if (!['admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  // Check seat limit — against the TEAM OWNER's plan, not the inviter's.
  // Seats are billed to the owner's subscription. Reading the inviter's plan
  // meant an admin member (almost always on the free plan themselves) resolved
  // to teamSeats: 1 and could never invite anyone, while a downgraded owner's
  // team kept full seats if an admin with a paid plan did the inviting.
  // Admin client: an admin member cannot read the owner's profile row under RLS.
  const adminDb = createAdminClient();
  const { data: ownerProfile } = await adminDb
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', team.owner_id)
    .single();
  const ownerLapsed =
    ownerProfile?.subscription_status === 'canceled' ||
    ownerProfile?.subscription_status === 'past_due';
  const plan = (
    ownerLapsed && ownerProfile?.plan !== 'free' ? 'free' : (ownerProfile?.plan ?? 'free')
  ) as 'free' | 'pro' | 'studio';
  const seatLimit = PLANS[plan].teamSeats;

  const inviteEmail = email.trim().toLowerCase();

  // Already on the team? Re-inviting them would burn a seat on an invite that
  // acceptInvite() rejects anyway ("You're already a member of this team.").
  if (members.some(m => m.profile.email?.toLowerCase() === inviteEmail)) {
    return NextResponse.json({ error: 'That person is already on your team.' }, { status: 409 });
  }

  const invites = await getTeamInvites(params.id);
  // EXPIRED invites must not hold a seat. getTeamInvites() only filters on
  // accepted_at, so every invite that timed out unaccepted kept counting
  // forever — a Studio team that sent 10 invites nobody clicked could never
  // invite again, with no way to free the seats except revoking one by one.
  const now = Date.now();
  const livePending = invites.filter(
    i => !i.accepted_at && new Date(i.expires_at).getTime() > now
  );

  if (livePending.some(i => i.email.toLowerCase() === inviteEmail)) {
    return NextResponse.json({ error: 'That email already has a pending invite.' }, { status: 409 });
  }

  if (members.length + livePending.length >= seatLimit) {
    return NextResponse.json({ error: `Seat limit reached (${seatLimit} seats on ${plan} plan).` }, { status: 402 });
  }

  const invite = await createInvite(params.id, inviteEmail, role as 'admin' | 'member', user.id);

  // Send invite email (fire-and-forget)
  const { data: inviterProfile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  // Awaited — the invite link only reaches the teammate by email.
  await sendTeamInviteEmail({
    to: inviteEmail,
    teamName: team.name,
    inviterName: inviterProfile?.full_name ?? inviterProfile?.email ?? 'Someone',
    acceptUrl: `${appUrl}/team/invite/${invite.token}`,
    role,
  }).catch(() => {});

  return NextResponse.json(invite, { status: 201 });
}
