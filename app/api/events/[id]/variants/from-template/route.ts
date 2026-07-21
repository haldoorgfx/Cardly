import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import { buildSVG, TEMPLATE_CONFIGS, W, H } from '@/lib/templates/svgs';
import { injectSvgFonts } from '@/lib/templates/svg-fonts';
import { getTemplateZones } from '@/lib/templates/apply';
import { slugifyBase } from '@/lib/slug';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

// The zone factory used to be copy-pasted here, in /api/templates/use and in
// /api/events/create — three copies that had already drifted. It now lives in
// lib/templates/apply.ts.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify event ownership
  const { data: event } = await admin
    .from('events').select('id').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { templateId?: string; variantName?: string };
  const { templateId, variantName } = body;

  if (!templateId) return NextResponse.json({ error: 'templateId is required' }, { status: 400 });

  const config = TEMPLATE_CONFIGS[templateId];
  if (!config) return NextResponse.json({ error: 'Unknown template' }, { status: 400 });

  // Build SVG → rasterize to PNG
  const svgStr = injectSvgFonts(buildSVG(templateId, config.text));
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
  const slug = slugifyBase(name, 40)
    + '-' + crypto.randomUUID().slice(0, 6);

  const zones = getTemplateZones(config.accent, config.light ?? false);

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
