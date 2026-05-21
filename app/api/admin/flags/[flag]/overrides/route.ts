/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/admin/flags/[flag]/overrides — upsert per-user override
// Body: { userId: string; enabled: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: { flag: string } }
) {
  await requireAdmin();

  const { userId, enabled } = await req.json();
  if (typeof userId !== 'string' || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'userId (string) and enabled (boolean) are required.' }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await (db as any)
    .from('feature_flag_overrides')
    .upsert({ flag: params.flag, user_id: userId, enabled }, { onConflict: 'flag,user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/flags/[flag]/overrides?userId=uuid — remove override
export async function DELETE(
  req: NextRequest,
  { params }: { params: { flag: string } }
) {
  await requireAdmin();

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId query param required.' }, { status: 400 });

  const db = createAdminClient();
  const { error } = await (db as any)
    .from('feature_flag_overrides')
    .delete()
    .eq('flag', params.flag)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
