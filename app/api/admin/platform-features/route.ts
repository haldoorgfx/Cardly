import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { PLATFORM_FEATURES_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import { PLATFORM_FEATURE_KEYS, PLATFORM_FEATURE_META, getAllPlatformFeatureFlags, platformFlagName, type PlatformFeatureKey } from '@/lib/features/platform';

// GET /api/admin/platform-features — list every platform:* flag (super_admin only)
export async function GET() {
  const result = await getAuthorizedUser(PLATFORM_FEATURES_MANAGE);
  if ('error' in result) return result.error;

  const flags = await getAllPlatformFeatureFlags();
  return NextResponse.json({ flags });
}

// PATCH /api/admin/platform-features — toggle one platform feature (super_admin only)
// Body: { key: PlatformFeatureKey; enabled: boolean }
export async function PATCH(req: NextRequest) {
  const result = await getAuthorizedUser(PLATFORM_FEATURES_MANAGE);
  if ('error' in result) return result.error;
  const { user } = result;

  const body = await req.json().catch(() => null);
  const { key, enabled } = body ?? {};
  if (typeof key !== 'string' || !PLATFORM_FEATURE_KEYS.includes(key as PlatformFeatureKey) || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: `key must be one of: ${PLATFORM_FEATURE_KEYS.join(', ')}; enabled must be boolean` }, { status: 400 });
  }

  const flag = platformFlagName(key as PlatformFeatureKey);
  const admin = createAdminClient();

  // Update first (leaves label/description alone). Only if no row matched —
  // this key added after migration 122 shipped, or the migration hasn't been
  // pasted in yet — insert one with its real label, so the toggle still
  // works either way without ever clobbering an existing label back to a
  // raw key on a routine toggle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateError } = await (admin as any)
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('flag', flag)
    .select('flag')
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (!updated) {
    const meta = PLATFORM_FEATURE_META[key as PlatformFeatureKey];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (admin as any)
      .from('feature_flags')
      .insert({ flag, label: meta.label, description: meta.description, enabled });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await logAudit(user, 'platform_feature.toggle', 'feature_flags', flag, { after: { enabled } });

  return NextResponse.json({ ok: true });
}
