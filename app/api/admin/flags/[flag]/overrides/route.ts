/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getSessionUser } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';

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

  const actor = await getSessionUser();
  if (actor) {
    await logAudit(actor, 'feature_flag_override.upsert', 'feature_flag_overrides', `${params.flag}:${userId}`, { after: { flag: params.flag, userId, enabled } });
  }

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

  const actor2 = await getSessionUser();
  if (actor2) {
    await logAudit(actor2, 'feature_flag_override.delete', 'feature_flag_overrides', `${params.flag}:${userId}`, { before: { flag: params.flag, userId } });
  }

  return NextResponse.json({ ok: true });
}
