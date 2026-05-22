import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeApiKey } from '@/lib/api-keys';

// DELETE /api/keys/[id] — revoke a key
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await revokeApiKey(params.id, user.id);
  return new NextResponse(null, { status: 204 });
}
