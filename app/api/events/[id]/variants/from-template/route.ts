import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import {
  buildSVG,
  TEMPLATE_CONFIGS,
  W, H,
  ZONE_PHOTO, ZONE_NAME, ZONE_TITLE, ZONE_ORG,
} from '@/lib/templates/svgs';
import type { Zone } from '@/types/database';

/** Zone factory — positions match shared SVG constants */
function getZones(accent: string, light: boolean): Zone[] {
  const nameColor  = light ? '#1A1A1A'           : '#FFFFFF';
  const titleColor = light ? 'rgba(0,0,0,0.55)'  : 'rgba(255,255,255,0.65)';
  const orgColor   = light ? 'rgba(0,0,0,0.40)'  : (accent.startsWith('rgba') ? 'rgba(255,255,255,0.45)' : `${accent}BB`);

  return [
    {
      id: 'z-photo',
      type: 'photo',
      label: 'Headshot',
      x: ZONE_PHOTO.x, y: ZONE_PHOTO.y, w: ZONE_PHOTO.w, h: ZONE_PHOTO.h,
      shape: 'circle',
      photoBorderColor: accent,
      photoBorderWidth: 4,
    },
    {
      id: 'z-name',
      type: 'text',
      label: 'Full Name',
      x: ZONE_NAME.x, y: ZONE_NAME.y, w: ZONE_NAME.w, h: ZONE_NAME.h,
      font: 'Plus Jakarta Sans', size: 56, weight: 700,
      color: nameColor, align: 'center',
      required: true, placeholder: 'Your name',
      lineHeight: 1.1, letterSpacing: -1,
    },
    {
      id: 'z-title',
      type: 'text',
      label: 'Title / Role',
      x: ZONE_TITLE.x, y: ZONE_TITLE.y, w: ZONE_TITLE.w, h: ZONE_TITLE.h,
      font: 'Inter', size: 26, weight: 400,
      color: titleColor, align: 'center',
      placeholder: 'Your title or role', lineHeight: 1.2,
    },
    {
      id: 'z-org',
      type: 'text',
      label: 'Organization',
      x: ZONE_ORG.x, y: ZONE_ORG.y, w: ZONE_ORG.w, h: ZONE_ORG.h,
      font: 'Inter', size: 22, weight: 400,
      color: orgColor, align: 'center',
      placeholder: 'Your organization', lineHeight: 1.2,
    },
  ];
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify event ownership
  const { data: event } = await admin
    .from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { templateId?: string; variantName?: string };
  const { templateId, variantName } = body;

  if (!templateId) return NextResponse.json({ error: 'templateId is required' }, { status: 400 });

  const config = TEMPLATE_CONFIGS[templateId];
  if (!config) return NextResponse.json({ error: 'Unknown template' }, { status: 400 });

  // Build SVG → rasterize to PNG
  const svgStr = buildSVG(templateId, config.text);
  const pngBuf = await sharp(Buffer.from(svgStr)).png().toBuffer();

  // Upload to storage
  const storagePath = `${user.id}/${id}-template-${templateId}-${Date.now()}.png`;
  const { error: uploadErr } = await admin.storage
    .from('event-backgrounds')
    .upload(storagePath, pngBuf, { contentType: 'image/png', upsert: false, cacheControl: '31536000' });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(storagePath);

  // Get next position
  const { data: existingVariants } = await admin
    .from('event_variants').select('position').eq('event_id', id)
    .order('position', { ascending: false }).limit(1);
  const nextPosition = (existingVariants?.[0]?.position ?? -1) + 1;

  const name = (variantName?.trim()) || config.name;
  const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40)
    + '-' + crypto.randomUUID().slice(0, 6);

  const zones = getZones(config.accent, config.light ?? false);

  const { data: variant, error: varErr } = await admin
    .from('event_variants')
    .insert({
      event_id: id,
      variant_name: name,
      variant_slug: slug,
      background_url: urlData.publicUrl,
      background_width: W,
      background_height: H,
      zones: zones as unknown as import('@/types/database').Json,
      position: nextPosition,
    })
    .select()
    .single();

  if (varErr) return NextResponse.json({ error: varErr.message }, { status: 500 });

  return NextResponse.json(variant);
}
