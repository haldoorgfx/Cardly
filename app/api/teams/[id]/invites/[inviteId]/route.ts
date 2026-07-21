/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getMyTeam, getTeamMembers } from '@/lib/teams/queries';

// DELETE /api/teams/[id]/invites/[inviteId] — revoke a pending invite
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; inviteId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await getMyTeam(user.id);
  if (!team || team.id !== params.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // Whoever may SEND an invite may also revoke it. POST /api/teams/[id]/invites
  // accepts owner OR admin, but revoke was owner-only — an admin could burn
  // seats on invites they had no way to take back.
  const members = await getTeamMembers(params.id);
  const myRole = members.find(m => m.user_id === user.id)?.role;
  if (team.owner_id !== user.id && myRole !== 'owner' && myRole !== 'admin') {
    return NextResponse.json({ error: 'Only team admins can revoke invites.' }, { status: 403 });
  }

  const db = createAdminClient();
  const { error } = await (db as any)
    .from('team_invites')
    .delete()
    .eq('id', params.inviteId)
    .eq('team_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
