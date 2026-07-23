import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeApiKey, rotateApiKey } from '@/lib/api-keys';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

// DELETE /api/keys/[id] — revoke a key
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await revokeApiKey(params.id, user.id);
  return new NextResponse(null, { status: 204 });
}

// POST /api/keys/[id]/rotate is expressed as POST /api/keys/[id] with { action: 'rotate' }
// — revokes this key and returns a fresh one with the same name + scopes.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body?.action !== 'rotate') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  }

  const result = await rotateApiKey(params.id, user.id);
  if (!result) return NextResponse.json({ error: 'Key not found.' }, { status: 404 });
  return NextResponse.json(result, { status: 201 });
}
