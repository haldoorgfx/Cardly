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

  // ── Strategy: rgba:true + extractChannel(3) for cross-platform color ────────
  // rgba:true tells Pango to render with transparent background. The text shape
  // appears in the alpha channel (ch 3). On Vercel Linux (older Cairo), `<span
  // foreground>` and similar color hints are ignored — text renders as white on
  // transparent. On Windows it renders as black on transparent. Either way, the
  // *alpha channel* reliably encodes the text mask on every platform.
  //
  // We extract that alpha channel directly (1 byte/px, no stride ambiguity),
  // then construct a fresh RGBA buffer with the target color and the extracted
  // alpha. No dest-in blend needed; no luminance inversion needed.
  const textInput: Record<string, unknown> = {
    text: pangoText,
    font: fontDesc,
    width: zone.w,
    align: sharpAlign,
    rgba: true,   // transparent background → text shape lives in alpha channel
    dpi: 72,
  };
  if (fontFilePath) textInput.fontfile = fontFilePath;

  let alphaBuf: Buffer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alphaBuf = await (sharp as any)({ text: textInput }).png().toBuffer();
  } catch (err) {
    console.error('[render] Pango text render failed, zone', zone.id, err);
    return base;
  }

  const { width: textW = zone.w, height: textH = zone.h } =
    await sharp(alphaBuf).metadata();

  // Extract alpha channel by index (3 = 4th channel).
  // Using extractChannel(3) rather than 'alpha' avoids name-resolution
  // differences across libvips versions.
  const alphaRaw = await sharp(alphaBuf)
    .extractChannel(3)
    .raw()
    .toBuffer();   // 1 byte per pixel — pure alpha mask

  // Parse target color
  const hexCol = color.replace('#', '').padEnd(6, '0');
  const cr = parseInt(hexCol.slice(0, 2), 16) || 0;
  const cg = parseInt(hexCol.slice(2, 4), 16) || 0;
  const cb = parseInt(hexCol.slice(4, 6), 16) || 0;

  // Build RGBA: flat target color + Pango alpha mask (1 byte/px, no ambiguity)
  const newPixels = Buffer.alloc(textW * textH * 4);
  for (let px = 0; px < textW * textH; px++) {
    newPixels[px * 4]     = cr;
    newPixels[px * 4 + 1] = cg;
    newPixels[px * 4 + 2] = cb;
    newPixels[px * 4 + 3] = alphaRaw[px] ?? 0;
  }

  // Diagnostic
  let greyDark = 0, greyMin = 255, greyMax = 0;
  for (let px = 0; px < alphaRaw.length; px++) {
    const v = alphaRaw[px];
    if (v > 0) greyDark++;
    if (v < greyMin) greyMin = v;
    if (v > greyMax) greyMax = v;
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

  if (debugOut) debugOut.push({
    zoneId: zone.id, type: zone.type, text: text.slice(0, 20),
    fontDesc, color, fontFile: !!fontFilePath,
    renderedW: textW, renderedH: textH,
    greyMin, greyMax, darkPx: greyDark,
    overlayW: ow, overlayH: oh, left: compositeLeft, top: compositeTop,
  });

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

async function compositeImage(
  base: sharp.Sharp,
  zone: Zone,
  canvasW: number,
  canvasH: number,
): Promise<sharp.Sharp> {
  if (!zone.imageUrl) return base;
  const w = Math.max(1, Math.round(zone.w));
  const h = Math.max(1, Math.round(zone.h));
  const rotation    = zone.rotation ?? 0;
  const zoneOpacity = (zone.opacity ?? 100) / 100;

  const imgBuf = await fetchBuffer(zone.imageUrl);

  // Resize to zone bounds keeping full image visible (contain, transparent bg)
  let imgProcessed = await sharp(imgBuf)
    .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  if (zoneOpacity < 1) {
    const opSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <image href="data:image/png;base64,${imgProcessed.toString('base64')}"
        width="${w}" height="${h}" opacity="${zoneOpacity}"/>
    </svg>`;
    imgProcessed = await sharp(Buffer.from(opSvg)).png().toBuffer();
  }

  const { buf: finalBuf, w: fw, h: fh } = await rotateBuffer(imgProcessed, rotation);

  const zoneCX = zone.x + zone.w / 2;
  const zoneCY = zone.y + zone.h / 2;
  const left = Math.max(0, Math.min(Math.round(zoneCX - fw / 2), canvasW - fw));
  const top  = Math.max(0, Math.min(Math.round(zoneCY - fh / 2), canvasH - fh));

  const baseBuf = await base.png().toBuffer();
  return sharp(baseBuf).composite([{ input: finalBuf, left, top }]);
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

async function compositeShape(
  base: sharp.Sharp,
  zone: Zone,
  canvasW: number,
  canvasH: number,
): Promise<sharp.Sharp> {
  const w  = Math.max(1, Math.round(zone.w));
  const h  = Math.max(1, Math.round(zone.h));
  const fill       = zone.bgColor ?? '#1F4D3A';
  const fillOpacity = (zone.bgOpacity ?? 100) / 100;
  const stroke     = zone.strokeColor ?? 'none';
  const strokeW    = zone.strokeWidth  ?? 0;
  const sw2        = strokeW / 2;
  const st         = zone.shapeType   ?? 'rect';
  const rotation   = zone.rotation    ?? 0;
  const zoneOpacity = (zone.opacity   ?? 100) / 100;

  let shapeSvg: string;
  if (st === 'ellipse') {
    shapeSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${w / 2}" cy="${h / 2}" rx="${Math.max(1, w / 2 - sw2)}" ry="${Math.max(1, h / 2 - sw2)}"
        fill="${fill}" fill-opacity="${fillOpacity}"
        ${strokeW > 0 ? `stroke="${stroke}" stroke-width="${strokeW}"` : ''}/>
    </svg>`;
  } else if (st === 'triangle') {
    const pts = `${w / 2},${sw2} ${w - sw2},${h - sw2} ${sw2},${h - sw2}`;
    shapeSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${pts}"
        fill="${fill}" fill-opacity="${fillOpacity}"
        ${strokeW > 0 ? `stroke="${stroke}" stroke-width="${strokeW}"` : ''}/>
    </svg>`;
  } else if (st === 'line') {
    shapeSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}"
        stroke="${fill}" stroke-width="${h}" stroke-opacity="${fillOpacity}"/>
    </svg>`;
  } else {
    // rect (default)
    shapeSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${sw2}" y="${sw2}" width="${Math.max(1, w - strokeW)}" height="${Math.max(1, h - strokeW)}"
        fill="${fill}" fill-opacity="${fillOpacity}"
        ${strokeW > 0 ? `stroke="${stroke}" stroke-width="${strokeW}"` : ''}/>
    </svg>`;
  }

  let shapeBuf = await sharp(Buffer.from(shapeSvg)).png().toBuffer();

  if (zoneOpacity < 1) {
    const opSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <image href="data:image/png;base64,${shapeBuf.toString('base64')}"
        width="${w}" height="${h}" opacity="${zoneOpacity}"/>
    </svg>`;
    shapeBuf = await sharp(Buffer.from(opSvg)).png().toBuffer();
  }

  const { buf: finalBuf, w: fw, h: fh } = await rotateBuffer(shapeBuf, rotation);

  const zoneCX = zone.x + zone.w / 2;
  const zoneCY = zone.y + zone.h / 2;
  const left = Math.max(0, Math.min(Math.round(zoneCX - fw / 2), canvasW - fw));
  const top  = Math.max(0, Math.min(Math.round(zoneCY - fh / 2), canvasH - fh));

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

  const isDebug = formData.get('debug') === '1';
  const needsWatermark = !profile || profile.plan === 'free';
  const zones = (variant.zones as unknown as Zone[]) ?? [];
  const fieldsJson = formData.get('fields') as string;
  const fields: Record<string, string> = fieldsJson ? JSON.parse(fieldsJson) : {};
  const debugOut: ZoneDebug[] = [];
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
        pipeline = await compositeText(pipeline, zone, text, canvasW, canvasH, fontFilePath, debugOut);
      }
    } else if (zone.type === 'label') {
      // Static text baked into the design — always rendered, no attendee input needed
      const text = (zone.sample || zone.placeholder || '').trim();
      if (text) {
        const family = (zone.font ?? '').replace(/'/g, '');
        const weight = zone.weight ?? 400;
        const fontFilePath = fontFileMap.get(`${family}:${weight}`) ?? null;
        pipeline = await compositeText(pipeline, zone, text, canvasW, canvasH, fontFilePath, debugOut);
      }
    } else if (zone.type === 'photo') {
      const photoFile = formData.get(`photo_${zone.id}`) as File | null;
      if (photoFile) {
        const photoBuf = Buffer.from(await photoFile.arrayBuffer());
        pipeline = await compositePhoto(pipeline, zone, photoBuf, canvasW, canvasH);
      }
    } else if (zone.type === 'shape') {
      pipeline = await compositeShape(pipeline, zone, canvasW, canvasH);
    } else if (zone.type === 'image') {
      pipeline = await compositeImage(pipeline, zone, canvasW, canvasH);
    }
  }

  // Debug mode: return diagnostics JSON without producing the PNG
  if (isDebug) {
    return NextResponse.json({ variantId, debugOut });
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
