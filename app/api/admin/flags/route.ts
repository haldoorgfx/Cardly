/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { getAllFlags } from '@/lib/flags';

// GET /api/admin/flags — list all feature flags
export async function GET() {
  await requireAdmin();
  const flags = await getAllFlags();
  return NextResponse.json(flags);
}

// PATCH /api/admin/flags — toggle a flag globally
// Body: { flag: string; enabled: boolean }
export async function PATCH(req: NextRequest) {
  await requireAdmin();

  const { flag, enabled } = await req.json();
  if (typeof flag !== 'string' || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'flag (string) and enabled (boolean) are required.' }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await (db as any)
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('flag', flag);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
