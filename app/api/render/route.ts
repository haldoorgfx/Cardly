import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Zone } from '@/types/database';

const WATERMARK_HEIGHT = 36;

// ── Google Fonts cache: "Family:weight" → absolute path to TTF in /tmp ───────
const fontCache = new Map<string, string>();

// System fonts that don't need fetching
const SYSTEM_FONTS = new Set([
  'georgia', 'times new roman', 'times', 'arial', 'helvetica',
  'verdana', 'trebuchet ms', 'courier new', 'courier',
  'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
]);

/** Returns an absolute path to a TTF file in /tmp, downloading if needed. */
async function ensureFontFile(family: string, weight: number): Promise<string | null> {
  const key = `${family}:${weight}`;
  if (fontCache.has(key)) return fontCache.get(key)!;
  if (SYSTEM_FONTS.has(family.toLowerCase())) return null;

  try {
    const familyParam = family.trim().replace(/\s+/g, '+');
    const safeName   = family.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tmpDir     = os.tmpdir();  // /tmp on Vercel Linux
    const fontPath   = path.join(tmpDir, `gf-${safeName}-${weight}.ttf`);

    // Reuse cached file if it already exists on disk (warm lambda)
    if (fs.existsSync(fontPath)) {
      fontCache.set(key, fontPath);
      return fontPath;
    }

    // Legacy CSS1 API → Google always returns a TTF download URL
    const cssUrl = `https://fonts.googleapis.com/css?family=${familyParam}:${weight}`;
    const cssRes = await fetch(cssUrl);
    if (cssRes.ok) {
      const css      = await cssRes.text();
      const ttfMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
      if (ttfMatch) {
        const fontRes = await fetch(ttfMatch[1]);
        if (fontRes.ok) {
          fs.writeFileSync(fontPath, Buffer.from(await fontRes.arrayBuffer()));
          fontCache.set(key, fontPath);
          return fontPath;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function applyTextTransform(text: string, transform?: string): string {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  return text;
}

// ── Pango weight tokens ───────────────────────────────────────────────────────
function pangoWeight(w: number): string {
  if (w >= 900) return 'Heavy';
  if (w >= 800) return 'Ultra-Bold';
  if (w >= 700) return 'Bold';
  if (w >= 600) return 'Semi-Bold';
  if (w >= 500) return 'Medium';
  return 'Regular';
}

// Rotate a sharp buffer by arbitrary degrees, returning the new buffer + dimensions
async function rotateBuffer(
  buf: Buffer,
  degrees: number,
): Promise<{ buf: Buffer; w: number; h: number }> {
  if (!degrees || degrees === 0) {
    const meta = await sharp(buf).metadata();
    return { buf, w: meta.width!, h: meta.height! };
  }
  const rotated = await sharp(buf)
    .rotate(degrees, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const meta = await sharp(rotated).metadata();
  return { buf: rotated, w: meta.width!, h: meta.height! };
}

interface ZoneDebug {
  zoneId: string;
  type: string;
  text: string;
  fontDesc: string;
  color: string;
  fontFile: boolean;
  renderedW: number;
  renderedH: number;
  greyMin: number;
  greyMax: number;
  darkPx: number;
  overlayW: number;
  overlayH: number;
  left: number;
  top: number;
}

async function compositeText(
  base: sharp.Sharp,
  zone: Zone,
  text: string,
  canvasW: number,
  canvasH: number,
  fontFilePath?: string | null,
  debugOut?: ZoneDebug[],
): Promise<sharp.Sharp> {
  const rawText = applyTextTransform(text, zone.textTransform);
  const font    = (zone.font ?? 'Sans').replace(/'/g, '');
  const size    = Math.max(8, zone.size ?? 32);
  const weight  = zone.weight ?? 400;
  const color   = zone.color ?? '#FFFFFF';
  const align   = zone.align ?? 'left';
  const ls      = zone.letterSpacing ?? 0;
  const zoneOpacity = (zone.opacity ?? 100) / 100;
  const rotation    = zone.rotation ?? 0;

  // Escape special chars
  const safe = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Pango font description: "Family Weight Size"
  const fontDesc = `${font} ${pangoWeight(weight)} ${size}`;

  // Letter-spacing via Pango markup attribute (thousandths of a point)
  const lsAttr = ls !== 0 ? ` letter_spacing="${Math.round(ls * 1024)}"` : '';
  const pangoText = lsAttr ? `<span${lsAttr}>${safe}</span>` : safe;

  const sharpAlign = align === 'center' ? 'centre' : (align as 'left' | 'right');

  // ── Strategy: render WITHOUT rgba:true ───────────────────────────────────
  // On Vercel Linux (older Cairo/GTK), rgba:true sometimes produces an
  // *opaque* white background instead of transparent. That means our
  // subsequent pixel loop sets alpha=255 everywhere, creating a solid color
  // block that wipes out all previously composited zones.
  //
  // Instead we render with the default (black text on opaque white background),
  // flatten any potential transparency to white, then convert to greyscale
  // (1 byte / pixel). Inverted luminance gives us a clean text-shape alpha mask
  // that is 100% reliable across Windows, Linux, and every libvips version.
  const textInput: Record<string, unknown> = {
    text: pangoText,
    font: fontDesc,
    width: zone.w,
    align: sharpAlign,
    dpi: 72,
    // NOTE: intentionally omitting rgba:true — see above
  };
  if (fontFilePath) textInput.fontfile = fontFilePath;

  let renderedBuf: Buffer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderedBuf = await (sharp as any)({ text: textInput }).png().toBuffer();
  } catch (err) {
    console.error('[render] Pango text render failed, zone', zone.id, err);
    return base;
  }

  // Flatten any alpha to white, then extract single-channel luminance.
  // White pixels (BG) → lum 255 → inverted alpha 0 (transparent).
  // Black pixels (text) → lum 0 → inverted alpha 255 (opaque).
  const { data: greyPixels, info: greyInfo } = await sharp(renderedBuf)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const textW = greyInfo.width;
  const textH = greyInfo.height;

  // Diagnostic: gather grey stats to detect all-white (no text) output
  let greyMin = 255, greyMax = 0, greyDark = 0;
  for (let px = 0; px < greyPixels.length; px++) {
    const v = greyPixels[px];
    if (v < greyMin) greyMin = v;
    if (v > greyMax) greyMax = v;
    if (v < 128) greyDark++;
  }

  // Parse target color
  const hexCol = color.replace('#', '').padEnd(6, '0');
  const cr = parseInt(hexCol.slice(0, 2), 16) || 0;
  const cg = parseInt(hexCol.slice(2, 4), 16) || 0;
  const cb = parseInt(hexCol.slice(4, 6), 16) || 0;

  // Build RGBA buffer: fill with target color, alpha = inverted luminance
  const newPixels = Buffer.alloc(textW * textH * 4);
  for (let px = 0; px < textW * textH; px++) {
    newPixels[px * 4]     = cr;
    newPixels[px * 4 + 1] = cg;
    newPixels[px * 4 + 2] = cb;
    newPixels[px * 4 + 3] = 255 - greyPixels[px]; // inverted lum = text mask
  }

  let rawBuf = await sharp(newPixels, {
    raw: { width: textW, height: textH, channels: 4 },
  }).png().toBuffer();

  // Optional background rect (rendered as a plain SVG, no font needed)
  if (zone.bgColor) {
    const bgSvg = `<svg width="${textW}" height="${textH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${textW}" height="${textH}"
        fill="${zone.bgColor}" opacity="${(zone.bgOpacity ?? 60) / 100}"/>
    </svg>`;
    const bgBuf = await sharp(Buffer.from(bgSvg)).png().toBuffer();
    rawBuf = await sharp(bgBuf).composite([{ input: rawBuf }]).png().toBuffer();
  }

  // Opacity
  if (zoneOpacity < 1) {
    const opSvg = `<svg width="${textW}" height="${textH}" xmlns="http://www.w3.org/2000/svg">
      <image href="data:image/png;base64,${rawBuf.toString('base64')}"
        width="${textW}" height="${textH}" opacity="${zoneOpacity}"/>
    </svg>`;
    rawBuf = await sharp(Buffer.from(opSvg)).png().toBuffer();
  }

  // Rotation
  const { buf: overlay, w: ow, h: oh } = await rotateBuffer(rawBuf, rotation);

  // Position the text image so it sits in the right place within the zone.
  // sharp text output width = natural text width (≤ zone.w).
  // For center/right alignment we must shift left accordingly.
  let left = zone.x;
  if (align === 'center') left = Math.round(zone.x + (zone.w - ow) / 2);
  if (align === 'right')  left = Math.round(zone.x + zone.w - ow);

  const top = zone.y;

  const compositeLeft  = Math.max(0, Math.min(left, canvasW - ow));
  const compositeTop   = Math.max(0, Math.min(top,  canvasH - oh));

  const dbg = {
    zoneId: zone.id, type: zone.type, text: text.slice(0, 20),
    fontDesc, color, fontFile: !!fontFilePath,
    renderedW: textW, renderedH: textH,
    greyMin, greyMax, darkPx: greyDark,
    overlayW: ow, overlayH: oh, left: compositeLeft, top: compositeTop,
  };
  console.log('[render]', JSON.stringify(dbg));
  if (debugOut) debugOut.push(dbg);

  // Materialize base to a buffer before compositing.
  // sharp's .composite() replaces (not appends) when chained on a lazy pipeline —
  // converting to an intermediate buffer ensures all zones stack correctly.
  const baseBuf = await base.png().toBuffer();
  return sharp(baseBuf).composite([{
    input: overlay,
    left:  compositeLeft,
    top:   compositeTop,
  }]);
}

async function compositePhoto(
  base: sharp.Sharp,
  zone: Zone,
  photoBuffer: Buffer,
  canvasW: number,
  canvasH: number,
): Promise<sharp.Sharp> {
  const w = Math.max(1, Math.round(zone.w));
  const h = Math.max(1, Math.round(zone.h));
  const shape = zone.shape ?? 'square';
  const rotation = zone.rotation ?? 0;
  const zoneOpacity = (zone.opacity ?? 100) / 100;
  const borderColor = zone.photoBorderColor;
  const borderWidth = zone.photoBorderWidth ?? 0;

  let photoSharp = sharp(photoBuffer).resize(w, h, { fit: 'cover', position: 'center' });

  // Shape mask
  if (shape === 'circle') {
    const mask = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 1}" ry="${h / 2 - 1}" fill="white"/>
    </svg>`;
    const maskBuf = await sharp(Buffer.from(mask)).png().toBuffer();
    photoSharp = sharp(await photoSharp.png().toBuffer()).composite([{ input: maskBuf, blend: 'dest-in' }]);
  } else if (shape === 'rounded') {
    const r = Math.min(w, h) * 0.2;
    const mask = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/>
    </svg>`;
    const maskBuf = await sharp(Buffer.from(mask)).png().toBuffer();
    photoSharp = sharp(await photoSharp.png().toBuffer()).composite([{ input: maskBuf, blend: 'dest-in' }]);
  }

  let photoBuf = await photoSharp.png().toBuffer();

  // Border overlay
  if (borderColor && borderWidth > 0) {
    const r = shape === 'circle' ? '50%' : shape === 'rounded' ? `${Math.min(w, h) * 0.2}` : '0';
    const borderSvg = shape === 'circle'
      ? `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - borderWidth / 2}" ry="${h / 2 - borderWidth / 2}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}"/></svg>`
      : `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect x="${borderWidth / 2}" y="${borderWidth / 2}" width="${w - borderWidth}" height="${h - borderWidth}" rx="${r}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}"/></svg>`;
    const borderBuf = await sharp(Buffer.from(borderSvg)).png().toBuffer();
    photoBuf = await sharp(photoBuf).composite([{ input: borderBuf }]).png().toBuffer();
  }

  // Opacity
  if (zoneOpacity < 1) {
    const blendSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,${photoBuf.toString('base64')}" width="${w}" height="${h}" opacity="${zoneOpacity}"/></svg>`;
    photoBuf = await sharp(Buffer.from(blendSvg)).png().toBuffer();
  }

  // Rotation
  const { buf: finalBuf, w: fw, h: fh } = await rotateBuffer(photoBuf, rotation);

  // Center on original zone center
  const zoneCX = zone.x + zone.w / 2;
  const zoneCY = zone.y + zone.h / 2;
  const left = Math.max(0, Math.min(Math.round(zoneCX - fw / 2), canvasW - fw));
  const top = Math.max(0, Math.min(Math.round(zoneCY - fh / 2), canvasH - fh));

  const baseBuf = await base.png().toBuffer();
  return sharp(baseBuf).composite([{ input: finalBuf, left, top }]);
}

async function addWatermark(base: sharp.Sharp, canvasW: number, canvasH: number): Promise<sharp.Sharp> {
  const svg = `<svg width="${canvasW}" height="${WATERMARK_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${canvasW}" height="${WATERMARK_HEIGHT}" fill="rgba(0,0,0,0.4)"/>
    <text
      x="${canvasW / 2}"
      y="${WATERMARK_HEIGHT * 0.68}"
      font-family="Inter, sans-serif"
      font-size="18"
      font-weight="500"
      fill="rgba(255,255,255,0.75)"
      text-anchor="middle"
    >Made with Cardly</text>
  </svg>`;
  const svgBuf = await sharp(Buffer.from(svg)).png().toBuffer();
  const baseBuf = await base.png().toBuffer();
  return sharp(baseBuf).composite([{ input: svgBuf, left: 0, top: canvasH - WATERMARK_HEIGHT }]);
}

export async function GET(req: NextRequest) {
  // Debug probe: GET /api/render?debug=1&variantId=xxx&fields=...
  // Returns JSON diagnostics for each text zone instead of the PNG.
  const url = new URL(req.url);
  if (url.searchParams.get('debug') !== '1') {
    return NextResponse.json({ error: 'Use POST for rendering or add ?debug=1' }, { status: 405 });
  }
  const fakeBody = new URLSearchParams(url.search);
  const variantId = fakeBody.get('variantId') ?? '';
  const fieldsRaw = fakeBody.get('fields') ?? '{}';
  const fields: Record<string, string> = JSON.parse(fieldsRaw);

  const supabase = createAdminClient();
  const { data: variant } = await supabase
    .from('event_variants')
    .select('id, background_url, background_width, background_height, zones, event_id, events(id, status, user_id, download_count)')
    .eq('id', variantId)
    .single();
  if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  const event = variant.events as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const zones = (variant.zones as unknown as Zone[]) ?? [];
  const canvasW = variant.background_width ?? 1080;
  const canvasH = variant.background_height ?? 1350;

  const fontKeys = new Map<string, { family: string; weight: number }>();
  for (const z of zones) {
    if ((z.type === 'text' || z.type === 'custom' || z.type === 'label') && z.font) {
      fontKeys.set(`${z.font}:${z.weight ?? 400}`, { family: z.font, weight: z.weight ?? 400 });
    }
  }
  const fontFileMap = new Map<string, string | null>();
  await Promise.all(
    Array.from(fontKeys.entries()).map(async ([key, { family, weight }]) => {
      fontFileMap.set(key, await ensureFontFile(family, weight));
    })
  );

  const bgBuffer = await fetchBuffer(variant.background_url!);
  let pipeline = sharp(bgBuffer).resize(canvasW, canvasH, { fit: 'fill' });
  const debugOut: ZoneDebug[] = [];

  for (const zone of zones) {
    if (zone.hidden) continue;
    if (zone.type === 'text' || zone.type === 'custom' || zone.type === 'label') {
      const text = fields[zone.id]?.trim() || zone.sample || zone.placeholder || 'test';
      if (text) {
        const family = (zone.font ?? '').replace(/'/g, '');
        const weight = zone.weight ?? 400;
        const fontFilePath = fontFileMap.get(`${family}:${weight}`) ?? null;
        pipeline = await compositeText(pipeline, zone, text, canvasW, canvasH, fontFilePath, debugOut);
      }
    }
  }

  return NextResponse.json({ variantId, zones: zones.length, debugOut });
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  const formData = await req.formData();
  const variantId = formData.get('variantId') as string;

  if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });

  const { data: variant } = await supabase
    .from('event_variants')
    .select('id, background_url, background_width, background_height, zones, event_id, events(id, status, user_id, download_count)')
    .eq('id', variantId)
    .single();

  if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = variant.events as any;
  if (!event || event.status !== 'published') {
    return NextResponse.json({ error: 'Event not found or not published' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', event.user_id)
    .single();

  const needsWatermark = !profile || profile.plan === 'free';
  const zones = (variant.zones as unknown as Zone[]) ?? [];
  const fieldsJson = formData.get('fields') as string;
  const fields: Record<string, string> = fieldsJson ? JSON.parse(fieldsJson) : {};
  const canvasW = variant.background_width ?? 1080;
  const canvasH = variant.background_height ?? 1350;

  // Ensure TTF files for all unique fonts (downloads to /tmp, cached in memory)
  const fontKeys = new Map<string, { family: string; weight: number }>();
  for (const z of zones) {
    if ((z.type === 'text' || z.type === 'custom' || z.type === 'label') && z.font) {
      const family = z.font.replace(/'/g, '');
      const weight = z.weight ?? 400;
      fontKeys.set(`${family}:${weight}`, { family, weight });
    }
  }
  const fontFileMap = new Map<string, string | null>();
  await Promise.all(
    Array.from(fontKeys.entries()).map(async ([key, { family, weight }]) => {
      fontFileMap.set(key, await ensureFontFile(family, weight));
    })
  );

  const bgBuffer = await fetchBuffer(variant.background_url!);
  let pipeline = sharp(bgBuffer).resize(canvasW, canvasH, { fit: 'fill' });

  for (const zone of zones) {
    if (zone.hidden) continue;

    if (zone.type === 'text' || zone.type === 'custom') {
      const text = fields[zone.id]?.trim();
      if (text) {
        const family = (zone.font ?? '').replace(/'/g, '');
        const weight = zone.weight ?? 400;
        const fontFilePath = fontFileMap.get(`${family}:${weight}`) ?? null;
        pipeline = await compositeText(pipeline, zone, text, canvasW, canvasH, fontFilePath);
      }
    } else if (zone.type === 'label') {
      // Static text baked into the design — always rendered, no attendee input needed
      const text = (zone.sample || zone.placeholder || '').trim();
      if (text) {
        const family = (zone.font ?? '').replace(/'/g, '');
        const weight = zone.weight ?? 400;
        const fontFilePath = fontFileMap.get(`${family}:${weight}`) ?? null;
        pipeline = await compositeText(pipeline, zone, text, canvasW, canvasH, fontFilePath);
      }
    } else if (zone.type === 'photo') {
      const photoFile = formData.get(`photo_${zone.id}`) as File | null;
      if (photoFile) {
        const photoBuf = Buffer.from(await photoFile.arrayBuffer());
        pipeline = await compositePhoto(pipeline, zone, photoBuf, canvasW, canvasH);
      }
    }
  }

  if (needsWatermark) {
    pipeline = await addWatermark(pipeline, canvasW, canvasH);
  }

  const outputBuffer = await pipeline.png({ quality: 92 }).toBuffer();

  // Geo headers from Vercel
  const geoCity    = req.headers.get('x-vercel-ip-city')
    ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!) : null;
  const geoCountry = req.headers.get('x-vercel-ip-country') ?? null;
  const geoLat     = req.headers.get('x-vercel-ip-latitude')
    ? parseFloat(req.headers.get('x-vercel-ip-latitude')!) : null;
  const geoLng     = req.headers.get('x-vercel-ip-longitude')
    ? parseFloat(req.headers.get('x-vercel-ip-longitude')!) : null;

  const attendeeName = Object.values(fields).find(v => v?.trim()) ?? 'Anonymous';
  const attendeeData = {
    ...fields,
    ...(geoCity    ? { _city:    geoCity    } : {}),
    ...(geoCountry ? { _country: geoCountry } : {}),
    ...(geoLat     ? { _lat:     geoLat     } : {}),
    ...(geoLng     ? { _lng:     geoLng     } : {}),
  };

  supabase.from('generated_cards').insert({
    event_id: event.id,
    variant_id: variantId,
    attendee_name: attendeeName,
    attendee_data: attendeeData,
    output_url: null,
  }).then(() => {
    supabase
      .from('events')
      .update({ download_count: (event.download_count ?? 0) + 1 })
      .eq('id', event.id)
      .then(() => {});
  });

  return new Response(outputBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${variantId}-card.png"`,
      'Cache-Control': 'no-store',
    },
  });
}
