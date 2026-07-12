import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import { W, H } from '@/lib/templates/svgs';

/**
 * Accepts a CSS color or gradient string and generates a flat PNG background.
 * Supports:
 *   - Hex colors: #1F4D3A
 *   - rgb/rgba: rgba(31,77,58,1)
 *   - Named colors: white, black, etc.
 *   - CSS linear-gradient (rendered via SVG rect + linearGradient)
 */

// A single CSS color we're willing to interpolate into SVG markup: hex,
// rgb()/rgba() with plain numeric args, or a simple named color. Anything
// else (quotes, angle brackets, url(), var(), calc()) is rejected outright —
// this string is embedded in an SVG attribute that sharp rasterizes
// server-side, so it must never be able to close the attribute or introduce
// new elements.
const SAFE_COLOR =
  /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)|[a-zA-Z]{3,20})$/;

function isSafeColor(c: string): boolean {
  return SAFE_COLOR.test(c.trim());
}

function parseGradient(value: string): { from: string; to: string; angle: number } | null {
  const match = value.match(/^linear-gradient\(\s*([\d.]+)deg\s*,\s*([^,]+?)\s*(?:\d+%\s*)?,\s*([^)]+?)\s*(?:\d+%\s*)?\)$/);
  if (!match) return null;
  const from = match[2].trim();
  const to = match[3].trim();
  const angle = parseFloat(match[1]);
  if (!isSafeColor(from) || !isSafeColor(to) || !Number.isFinite(angle)) return null;
  return { angle, from, to };
}

function buildSolidSVG(value: string, w: number, h: number): string {
  // Reuse W and H names locally so the rest of the function still works
  const W = w, H = h;
  const grad = parseGradient(value);
  if (grad) {
    // Convert CSS angle to SVG gradient coordinates
    const rad = ((grad.angle - 90) * Math.PI) / 180;
    const x1 = 50 - Math.cos(rad) * 50;
    const y1 = 50 - Math.sin(rad) * 50;
    const x2 = 50 + Math.cos(rad) * 50;
    const y2 = 50 + Math.sin(rad) * 50;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${grad.from}"/>
      <stop offset="100%" stop-color="${grad.to}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`;
  }
  // Solid color
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${value}"/>
</svg>`;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { variantId?: string; value?: string };
  const { variantId, value } = body;
  if (!variantId || !value) {
    return NextResponse.json({ error: 'Missing variantId or value' }, { status: 400 });
  }

  // Only a plain color or a simple two-stop linear-gradient is accepted —
  // the value ends up inside server-rendered SVG markup.
  if (value.length > 200 || (!isSafeColor(value) && !parseGradient(value))) {
    return NextResponse.json(
      { error: 'Use a solid color (hex, rgb, or a color name) or a simple linear-gradient.' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Verify ownership; also read current canvas dimensions
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

  // Build SVG at correct size → PNG
  const svgStr = buildSolidSVG(value, targetW, targetH);
  const pngBuf = await sharp(Buffer.from(svgStr)).png().toBuffer();

  // Upload
  const storagePath = `${user.id}/solid-bg-${Date.now()}.png`;
  const { error: uploadErr } = await admin.storage
    .from('event-backgrounds')
    .upload(storagePath, pngBuf, { contentType: 'image/png', upsert: false, cacheControl: '31536000' });
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
