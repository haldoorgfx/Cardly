import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { acceptInvite } from '@/lib/teams/queries';

// POST /api/teams/invites/[token] — accept an invite
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await acceptInvite(params.token, user.id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to accept invite.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
