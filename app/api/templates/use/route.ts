import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import type { Zone } from '@/types/database';
import {
  buildSVG,
  TEMPLATE_CONFIGS,
  W, H,
  ZONE_PHOTO, ZONE_NAME, ZONE_TITLE, ZONE_ORG,
} from '@/lib/templates/svgs';
import { PLANS, type Plan } from '@/lib/billing/plans';
import { generateSlug } from '@/lib/slug';

/* ── Zone factory — positions match shared SVG constants ─ */
function getZones(accent: string, light: boolean): Zone[] {
  const nameColor  = light ? '#1A1A1A'              : '#FFFFFF';
  const titleColor = light ? 'rgba(0,0,0,0.55)'    : 'rgba(255,255,255,0.65)';
  const orgColor   = light ? 'rgba(0,0,0,0.40)'    : (accent.startsWith('rgba') ? 'rgba(255,255,255,0.45)' : `${accent}BB`);

  return [
    {
      id: 'z-photo',
      type: 'photo',
      label: 'Headshot',
      x: ZONE_PHOTO.x,
      y: ZONE_PHOTO.y,
      w: ZONE_PHOTO.w,
      h: ZONE_PHOTO.h,
      shape: 'circle',
      photoBorderColor: accent,
      photoBorderWidth: 4,
    },
    {
      id: 'z-name',
      type: 'text',
      label: 'Full Name',
      x: ZONE_NAME.x,
      y: ZONE_NAME.y,
      w: ZONE_NAME.w,
      h: ZONE_NAME.h,
      font: 'Plus Jakarta Sans',
      size: 56,
      weight: 700,
      color: nameColor,
      align: 'center',
      required: true,
      placeholder: 'Your name',
      lineHeight: 1.1,
      letterSpacing: -1,
    },
    {
      id: 'z-title',
      type: 'text',
      label: 'Title / Role',
      x: ZONE_TITLE.x,
      y: ZONE_TITLE.y,
      w: ZONE_TITLE.w,
      h: ZONE_TITLE.h,
      font: 'Inter',
      size: 26,
      weight: 400,
      color: titleColor,
      align: 'center',
      placeholder: 'Your title or role',
      lineHeight: 1.2,
    },
    {
      id: 'z-org',
      type: 'text',
      label: 'Organization',
      x: ZONE_ORG.x,
      y: ZONE_ORG.y,
      w: ZONE_ORG.w,
      h: ZONE_ORG.h,
      font: 'Inter',
      size: 22,
      weight: 400,
      color: orgColor,
      align: 'center',
      placeholder: 'Your organization',
      lineHeight: 1.2,
    },
  ];
}

/* ── Route ────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { templateId?: string };
  const templateId = body.templateId ?? '';
  const isDbTemplate = templateId.startsWith('db:');
  const config = !isDbTemplate ? TEMPLATE_CONFIGS[templateId] : null;
  if (!isDbTemplate && !config) return NextResponse.json({ error: 'Unknown template' }, { status: 400 });

  const admin = createAdminClient();

  /* Plan limit */
  const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.id).single();
  const plan = (profile?.plan ?? 'free') as Plan;
  const eventLimit = PLANS[plan]?.events ?? PLANS.free.events;
  if (eventLimit !== null) {
    const { count } = await admin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('status', 'archived');
    if ((count ?? 0) >= eventLimit) {
      return NextResponse.json({ error: 'PLAN_LIMIT', plan, limit: eventLimit }, { status: 402 });
    }
  }

  /* ── DB-backed (admin-managed) template path ────────────────── */
  if (isDbTemplate) {
    const dbId = templateId.slice(3);
    const { data: tpl } = await admin
      .from('templates')
      .select('name, background_url, dimensions, zones, min_plan, published')
      .eq('id', dbId)
      .eq('published', true)
      .single();

    if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    // Enforce the template's minimum plan
    const planRank: Record<string, number> = { free: 0, pro: 1, studio: 2 };
    if ((planRank[plan] ?? 0) < (planRank[tpl.min_plan] ?? 0)) {
      return NextResponse.json({ error: 'PLAN_LIMIT', plan }, { status: 402 });
    }

    const dims = (tpl.dimensions as { width?: number; height?: number } | null) ?? {};
    let event: { id: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: evErr } = await admin
        .from('events')
        .insert({ user_id: user.id, name: tpl.name, slug: generateSlug(tpl.name), status: 'draft' })
        .select('id')
        .single();
      if (!evErr) { event = data; break; }
      if (evErr.code !== '23505') return NextResponse.json({ error: evErr.message }, { status: 500 });
    }
    if (!event) return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 500 });

    const { error: varErr } = await admin
      .from('event_variants')
      .insert({
        event_id: event.id,
        variant_name: 'Attendee',
        variant_slug: 'attendee',
        background_url: tpl.background_url,
        background_width: dims.width ?? W,
        background_height: dims.height ?? H,
        zones: tpl.zones ?? [],
        position: 0,
      });
    if (varErr) return NextResponse.json({ error: varErr.message }, { status: 500 });

    return NextResponse.json({ id: event.id });
  }

  /* ── Built-in (code-defined) template path ──────────────────── */
  if (!config) return NextResponse.json({ error: 'Unknown template' }, { status: 400 });

  /* Build SVG (background + baked static text) → PNG via sharp */
  const svgStr = buildSVG(templateId, config.text);
  const pngBuf = await sharp(Buffer.from(svgStr)).png().toBuffer();

  /* Upload background PNG to Supabase storage */
  const storagePath = `${user.id}/template-${body.templateId}-${Date.now()}.png`;
  const { error: uploadErr } = await admin.storage
    .from('event-backgrounds')
    .upload(storagePath, pngBuf, { contentType: 'image/png', upsert: false, cacheControl: '31536000' });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(storagePath);

  /* Create event row — retry on slug collision */
  let event: { id: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error: evErr } = await admin
      .from('events')
      .insert({ user_id: user.id, name: config.name, slug: generateSlug(config.name), status: 'draft' })
      .select('id')
      .single();
    if (!evErr) { event = data; break; }
    if (evErr.code !== '23505') return NextResponse.json({ error: evErr.message }, { status: 500 });
  }
  if (!event) return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 500 });

  /* Zones — positions from shared lib/templates/svgs.ts constants */
  const zones = getZones(config.accent, config.light ?? false);

  /* Create variant */
  const { error: varErr } = await admin
    .from('event_variants')
    .insert({
      event_id: event.id,
      variant_name: 'Attendee',
      variant_slug: 'attendee',
      background_url: urlData.publicUrl,
      background_width: W,
      background_height: H,
      zones: zones as unknown as import('@/types/database').Json,
      position: 0,
    });
  if (varErr) return NextResponse.json({ error: varErr.message }, { status: 500 });

  return NextResponse.json({ id: event.id });
}
