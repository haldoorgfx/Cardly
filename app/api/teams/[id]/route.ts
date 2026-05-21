import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMyTeam, deleteTeam } from '@/lib/teams/queries';

// DELETE /api/teams/[id] — delete the team (owner only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await getMyTeam(user.id);
  if (!team || team.id !== params.id || team.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  await deleteTeam(params.id);
  return new NextResponse(null, { status: 204 });
}
