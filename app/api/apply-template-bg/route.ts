import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import { buildSVG, TEMPLATE_CONFIGS, W, H } from '@/lib/templates/svgs';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { variantId?: string; templateId?: string };
  const { variantId, templateId } = body;
  if (!variantId || !templateId) {
    return NextResponse.json({ error: 'Missing variantId or templateId' }, { status: 400 });
  }

  const config = TEMPLATE_CONFIGS[templateId];
  if (!config) return NextResponse.json({ error: 'Unknown template' }, { status: 400 });

  const admin = createAdminClient();

  // Verify variant belongs to a user-owned event; also read current canvas dimensions
  const { data: variant } = await admin
    .from('event_variants')
    .select('id, event_id, background_width, background_height')
    .eq('id', variantId)
    .single();
  if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

  const { data: event } = await admin
    .from('events')
    .select('user_id')
    .eq('id', variant.event_id)
    .single();
  if (!event || event.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use variant's existing canvas dimensions; fall back to template defaults
  const targetW = (variant.background_width  as number | null) ?? W;
  const targetH = (variant.background_height as number | null) ?? H;

  // Build SVG at target size → PNG
  const svgStr = buildSVG(templateId, config.text);
  // buildSVG always outputs W×H — resize via sharp if canvas differs
  const sharpPipe = sharp(Buffer.from(svgStr));
  const pngBuf = (targetW !== W || targetH !== H)
    ? await sharpPipe.resize(targetW, targetH, { fit: 'fill' }).png().toBuffer()
    : await sharpPipe.png().toBuffer();

  // Upload to storage
  const storagePath = `${user.id}/template-${templateId}-${Date.now()}.png`;
  const { error: uploadErr } = await admin.storage
    .from('event-backgrounds')
    .upload(storagePath, pngBuf, { contentType: 'image/png', upsert: false });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(storagePath);
  const backgroundUrl = urlData.publicUrl;

  // Patch variant
  await admin
    .from('event_variants')
    .update({ background_url: backgroundUrl, background_width: targetW, background_height: targetH })
    .eq('id', variantId);

  return NextResponse.json({ backgroundUrl, width: targetW, height: targetH });
}
