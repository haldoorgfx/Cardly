import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

  const { email, role = 'member' } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  if (!['admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  // Check seat limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();
  const plan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'studio';
  const seatLimit = PLANS[plan].teamSeats;

  const [members, invites] = await Promise.all([
    getTeamMembers(params.id),
    getTeamInvites(params.id),
  ]);
  const pendingCount = invites.filter(i => !i.accepted_at).length;
  if (members.length + pendingCount >= seatLimit) {
    return NextResponse.json({ error: `Seat limit reached (${seatLimit} seats on ${plan} plan).` }, { status: 402 });
  }

  const invite = await createInvite(params.id, email.trim().toLowerCase(), role as 'admin' | 'member', user.id);

  // Send invite email (fire-and-forget)
  const { data: inviterProfile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
  sendTeamInviteEmail({
    to: email.trim().toLowerCase(),
    teamName: team.name,
    inviterName: inviterProfile?.full_name ?? inviterProfile?.email ?? 'Someone',
    acceptUrl: `${appUrl}/team/invite/${invite.token}`,
    role,
  }).catch(() => {});

  return NextResponse.json(invite, { status: 201 });
}
