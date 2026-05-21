import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMyTeam, removeMember, updateMemberRole } from '@/lib/teams/queries';

// PATCH /api/teams/[id]/members/[userId] — change role
export async function PATCH(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await getMyTeam(user.id);
  if (!team || team.id !== params.id || team.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const { role } = await req.json();
  if (!['admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  await updateMemberRole(params.id, params.userId, role);
  return NextResponse.json({ ok: true });
}

// DELETE /api/teams/[id]/members/[userId] — remove member
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await getMyTeam(user.id);
  if (!team || team.id !== params.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // Owner can remove anyone; members can only remove themselves
  if (team.owner_id !== user.id && params.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  await removeMember(params.id, params.userId);
  return new NextResponse(null, { status: 204 });
}
