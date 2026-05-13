import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import type { Zone } from '@/types/database';

const WATERMARK_HEIGHT = 36;

// ── Google Fonts cache (module-level, survives hot-reload in dev) ────────────
const fontCache = new Map<string, string>(); // "Family:weight" → base64 woff2

// System fonts that don't need fetching
const SYSTEM_FONTS = new Set([
  'georgia', 'times new roman', 'times', 'arial', 'helvetica',
  'verdana', 'trebuchet ms', 'courier new', 'courier',
  'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
]);

async function fetchGoogleFontBase64(family: string, weight: number): Promise<string | null> {
  const key = `${family}:${weight}`;
  if (fontCache.has(key)) return fontCache.get(key)!;
  if (SYSTEM_FONTS.has(family.toLowerCase())) return null;

  try {
    const familyParam = family.trim().replace(/\s+/g, '+');
    // Request both the weight and a range to maximise match
    const cssUrl = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}&display=swap`;
    const cssRes = await fetch(cssUrl, {
      headers: {
        // Modern UA ensures Google returns woff2
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();

    // Extract first woff2 URL from the CSS
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
    if (!match) return null;

    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    const b64 = Buffer.from(await fontRes.arrayBuffer()).toString('base64');
    fontCache.set(key, b64);
    return b64;
  } catch {
    return null;
  }
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function applyTextTransform(text: string, transform?: string): string {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  return text;
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const approxCharWidth = fontSize * 0.55;
  const maxChars = Math.max(1, Math.floor(maxWidth / approxCharWidth));
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
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

async function compositeText(
  base: sharp.Sharp,
  zone: Zone,
  text: string,
  canvasW: number,
  canvasH: number,
  fontB64?: string | null,
): Promise<sharp.Sharp> {
  const rawText = applyTextTransform(text, zone.textTransform);
  const font = (zone.font ?? 'sans-serif').replace(/'/g, '');
  const size = Math.max(8, zone.size ?? 32);
  const weight = zone.weight ?? 400;
  const color = zone.color ?? '#FFFFFF';
  const align = zone.align ?? 'left';
  const lh = zone.lineHeight ?? 1.2;
  const ls = zone.letterSpacing ?? 0;
  const zoneOpacity = (zone.opacity ?? 100) / 100;
  const rotation = zone.rotation ?? 0;

  // Text effects
  const strokeColor = zone.strokeColor;
  const strokeWidth = zone.strokeWidth ?? 0;
  const shadowColor = zone.shadowColor;
  const shadowBlur = zone.shadowBlur ?? 0;
  const shadowX = zone.shadowX ?? 0;
  const shadowY = zone.shadowY ?? 0;

  const lines = wrapText(rawText, zone.w - 16, size);
  const lineHeight = size * lh;
  const totalH = lines.length * lineHeight;
  const svgH = Math.max(zone.h, totalH + size * 0.5);

  let textAnchor = 'start';
  let x = 8;
  if (align === 'center') { textAnchor = 'middle'; x = zone.w / 2; }
  if (align === 'right') { textAnchor = 'end'; x = zone.w - 8; }

  // Shadow filter
  const filterDef = (shadowColor && shadowBlur > 0)
    ? `<defs><filter id="sf" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${shadowX}" dy="${shadowY}" stdDeviation="${shadowBlur / 2}" flood-color="${shadowColor}" flood-opacity="1"/></filter></defs>`
    : '';
  const filterAttr = (shadowColor && shadowBlur > 0) ? 'filter="url(#sf)"' : '';

  // Background fill rect
  const bgRect = zone.bgColor
    ? `<rect x="0" y="0" width="${zone.w}" height="${svgH}" fill="${zone.bgColor}" opacity="${(zone.bgOpacity ?? 60) / 100}"/>`
    : '';

  const strokeAttrs = (strokeColor && strokeWidth > 0)
    ? `stroke="${strokeColor}" stroke-width="${strokeWidth}" paint-order="stroke fill"`
    : '';

  // Embed Google Font as @font-face so sharp/librsvg uses it
  const fontFaceDef = fontB64
    ? `<defs><style>@font-face{font-family:'${font}';font-weight:${weight};src:url(data:font/woff2;base64,${fontB64}) format('woff2');}</style></defs>`
    : '';

  const textEls = lines.map((line, i) => {
    const y = size + i * lineHeight;
    return `<text
      x="${x}"
      y="${y}"
      font-family="'${font}', DM Sans, Inter, sans-serif"
      font-size="${size}"
      font-weight="${weight}"
      fill="${color}"
      text-anchor="${textAnchor}"
      letter-spacing="${ls}"
      ${strokeAttrs}
      ${filterAttr}
    >${escapeXml(line)}</text>`;
  }).join('\n');

  const svg = `<svg width="${zone.w}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" opacity="${zoneOpacity}">${fontFaceDef}${filterDef}${bgRect}${textEls}</svg>`;
  const rawBuf = await sharp(Buffer.from(svg)).png().toBuffer();

  // Apply rotation
  const { buf: overlay, w: ow, h: oh } = await rotateBuffer(rawBuf, rotation);

  // Position centered on zone center
  const zoneCX = zone.x + zone.w / 2;
  const zoneCY = zone.y + svgH / 2;

  const left = Math.max(0, Math.min(Math.round(zoneCX - ow / 2), canvasW - ow));
  const top = Math.max(0, Math.min(Math.round(zoneCY - oh / 2), canvasH - oh));

  return base.composite([{ input: overlay, left, top }]);
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

  return base.composite([{ input: finalBuf, left, top }]);
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
  return base.composite([{ input: svgBuf, left: 0, top: canvasH - WATERMARK_HEIGHT }]);
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

  // Pre-fetch all unique fonts used by text/custom zones in parallel
  const fontKeys = new Map<string, { family: string; weight: number }>();
  for (const z of zones) {
    if ((z.type === 'text' || z.type === 'custom') && z.font) {
      const family = z.font.replace(/'/g, '');
      const weight = z.weight ?? 400;
      fontKeys.set(`${family}:${weight}`, { family, weight });
    }
  }
  const fontB64Map = new Map<string, string | null>();
  await Promise.all(
    Array.from(fontKeys.entries()).map(async ([key, { family, weight }]) => {
      fontB64Map.set(key, await fetchGoogleFontBase64(family, weight));
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
        const fontB64 = fontB64Map.get(`${family}:${weight}`) ?? null;
        pipeline = await compositeText(pipeline, zone, text, canvasW, canvasH, fontB64);
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
