import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  type ProfileUpdate = {
    full_name?: string | null;
    avatar_url?: string | null;
    organization?: string | null;
    timezone?: string | null;
    language?: string | null;
    currency?: string | null;
    date_format?: string | null;
    notify_downloads?: boolean;
    notify_views?: boolean;
    notify_registrations?: boolean;
    notify_daily_summary?: boolean;
    notify_card_shares?: boolean;
    notify_product_updates?: boolean;
  };

  const patch: ProfileUpdate = {};
  if ('full_name'             in body) patch.full_name             = typeof body.full_name === 'string' ? body.full_name.trim() : null;
  if ('avatar_url'            in body) patch.avatar_url            = typeof body.avatar_url === 'string' ? body.avatar_url : null;
  if ('organization'          in body) patch.organization          = typeof body.organization === 'string' ? body.organization.trim() : null;
  if ('timezone'              in body) patch.timezone              = typeof body.timezone === 'string' ? body.timezone : null;
  if ('language'              in body) patch.language              = typeof body.language === 'string' ? body.language : null;
  if ('currency'              in body) patch.currency              = typeof body.currency === 'string' ? body.currency : null;
  if ('date_format'           in body) patch.date_format           = typeof body.date_format === 'string' ? body.date_format : null;
  if ('notify_downloads'      in body) patch.notify_downloads      = Boolean(body.notify_downloads);
  if ('notify_views'          in body) patch.notify_views          = Boolean(body.notify_views);
  if ('notify_registrations'  in body) patch.notify_registrations  = Boolean(body.notify_registrations);
  if ('notify_daily_summary'  in body) patch.notify_daily_summary  = Boolean(body.notify_daily_summary);
  if ('notify_card_shares'    in body) patch.notify_card_shares    = Boolean(body.notify_card_shares);
  if ('notify_product_updates' in body) patch.notify_product_updates = Boolean(body.notify_product_updates);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update(patch).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
