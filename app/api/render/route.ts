import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import type { Zone } from '@/types/database';

const WATERMARK_HEIGHT = 36;

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

async function compositeText(
  base: sharp.Sharp,
  zone: Zone,
  text: string,
  canvasW: number,
  canvasH: number,
): Promise<sharp.Sharp> {
  const font = (zone.font ?? 'sans-serif').replace(/'/g, '');
  const size = Math.max(8, zone.size ?? 32);
  const weight = zone.weight ?? 400;
  const color = zone.color ?? '#FFFFFF';
  const align = zone.align ?? 'left';

  const lines = wrapText(text, zone.w - 16, size);
  const lineHeight = size * 1.25;
  const totalH = lines.length * lineHeight;
  const svgH = Math.max(zone.h, totalH + size * 0.5);

  let textAnchor = 'start';
  let x = 8;
  if (align === 'center') { textAnchor = 'middle'; x = zone.w / 2; }
  if (align === 'right') { textAnchor = 'end'; x = zone.w - 8; }

  const textEls = lines.map((line, i) => {
    const y = size + i * lineHeight;
    return `<text
      x="${x}"
      y="${y}"
      font-family="${font}, DM Sans, Inter, sans-serif"
      font-size="${size}"
      font-weight="${weight}"
      fill="${color}"
      text-anchor="${textAnchor}"
    >${escapeXml(line)}</text>`;
  }).join('\n');

  const svg = `<svg width="${zone.w}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">${textEls}</svg>`;
  const overlay = await sharp(Buffer.from(svg)).png().toBuffer();

  const left = Math.max(0, Math.min(Math.round(zone.x), canvasW - zone.w));
  const top = Math.max(0, Math.min(Math.round(zone.y), canvasH - Math.round(svgH)));

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

  let photoSharp = sharp(photoBuffer).resize(w, h, { fit: 'cover', position: 'center' });

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

  const photoBuf = await photoSharp.png().toBuffer();
  const left = Math.max(0, Math.min(Math.round(zone.x), canvasW - w));
  const top = Math.max(0, Math.min(Math.round(zone.y), canvasH - h));

  return base.composite([{ input: photoBuf, left, top }]);
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

  // Load the variant (join to event for status + user_id)
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

  const bgBuffer = await fetchBuffer(variant.background_url!);
  let pipeline = sharp(bgBuffer).resize(canvasW, canvasH, { fit: 'fill' });

  for (const zone of zones) {
    if (zone.hidden) continue;

    if (zone.type === 'text' || zone.type === 'custom') {
      const text = fields[zone.id]?.trim();
      if (text) {
        pipeline = await compositeText(pipeline, zone, text, canvasW, canvasH);
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

  // Fire-and-forget: save record + increment download count
  const attendeeName = Object.values(fields).find(v => v?.trim()) ?? 'Anonymous';
  supabase.from('generated_cards').insert({
    event_id: event.id,
    variant_id: variantId,
    attendee_name: attendeeName,
    attendee_data: fields,
    output_url: null,
  }).then(() => {
    supabase.from('events')
      .update({ download_count: (event.download_count ?? 0) + 1 })
      .eq('id', event.id);
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
