import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { THEME_EDIT, THEME_VIEW } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import { getSiteSettings } from '@/lib/theme/settings';

// GET /api/admin/theme — read current settings
export async function GET() {
  const result = await getAuthorizedUser(THEME_VIEW);
  if ('error' in result) return result.error;

  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

// PATCH /api/admin/theme — update settings
export async function PATCH(request: Request) {
  const result = await getAuthorizedUser(THEME_EDIT);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Read current state for audit diff
  const before = await getSiteSettings();

  // Only allow the updatable fields
  type SettingsUpdate = {
    brand_name?: string;
    logo_url?: string | null;
    logo_light_url?: string | null;
    favicon_url?: string | null;
    colors?: import('@/types/database').Json;
    fonts?: import('@/types/database').Json;
    gradients?: import('@/types/database').Json;
    updated_by?: string;
    updated_at?: string;
  };
  const update: SettingsUpdate = { updated_by: user.id, updated_at: new Date().toISOString() };
  if ('brand_name'     in body) update.brand_name     = body.brand_name     as string;
  if ('logo_url'       in body) update.logo_url       = body.logo_url       as string | null;
  if ('logo_light_url' in body) update.logo_light_url = body.logo_light_url as string | null;
  if ('favicon_url'    in body) update.favicon_url    = body.favicon_url    as string | null;
  if ('colors'      in body) update.colors       = body.colors      as import('@/types/database').Json;
  if ('fonts'       in body) update.fonts        = body.fonts       as import('@/types/database').Json;
  if ('gradients'   in body) update.gradients    = body.gradients   as import('@/types/database').Json;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('site_settings')
    .update(update)
    .eq('id', 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Read updated state for audit diff
  const after = await getSiteSettings();

  await logAudit(user, 'theme.update', 'site_settings', '1', {
    before: before as unknown as Record<string, unknown>,
    after:  after  as unknown as Record<string, unknown>,
  });

  return NextResponse.json(after);
}
