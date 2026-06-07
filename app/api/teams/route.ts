import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMyTeam, createTeam } from '@/lib/teams/queries';

// GET /api/teams — get my team
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await getMyTeam(user.id);
  return NextResponse.json(team);
}

// POST /api/teams — create a team (studio only)
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only studio plan can create teams
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', user.id)
    .single();

  const subscriptionFailed =
    profile?.subscription_status === 'canceled' ||
    profile?.subscription_status === 'past_due' ||
    profile?.subscription_status === 'unpaid';
  const plan = (subscriptionFailed && profile?.plan !== 'free') ? 'free' : (profile?.plan ?? 'free');

  if (plan !== 'studio') {
    return NextResponse.json({ error: 'Teams require a Studio plan.' }, { status: 402 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });

  // Check they don't already own/belong to a team
  const existing = await getMyTeam(user.id);
  if (existing) return NextResponse.json({ error: 'You already belong to a team.' }, { status: 409 });

  const team = await createTeam(user.id, name.trim());
  return NextResponse.json(team, { status: 201 });
}
