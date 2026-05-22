import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import type { Zone } from '@/types/database';
import { canGenerateCard, incrementCardsThisMonth } from '@/lib/billing/can';
import { PLANS } from '@/lib/billing/plans';
import { fireWebhooks } from '@/lib/webhooks';
import { maybeSendDownloadMilestone } from '@/lib/email';

const WATERMARK_HEIGHT = 40;

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function compositeText(base: sharp.Sharp, zone: Zone, text: string, canvasW: number, canvasH: number): Promise<sharp.Sharp> {
  const font = zone.font ?? 'sans-serif';
  const size = zone.size ?? 32;
  const weight = zone.weight ?? 400;
  const color = zone.color ?? '#FFFFFF';
  const align = zone.align ?? 'left';

  // Build SVG text overlay
  const svgWidth = zone.w;
  const svgHeight = zone.h;

  let textAnchor = 'start';
  let x = 8;
  if (align === 'center') { textAnchor = 'middle'; x = svgWidth / 2; }
  if (align === 'right') { textAnchor = 'end'; x = svgWidth - 8; }

  const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    <text
      x="${x}"
      y="${svgHeight * 0.75}"
      font-family="${font}, sans-serif"
      font-size="${size}"
      font-weight="${weight}"
      fill="${color}"
      text-anchor="${textAnchor}"
      dominant-baseline="auto"
    >${escapedText}</text>
  </svg>`;

  const svgBuf = Buffer.from(svg);
  const overlay = await sharp(svgBuf).png().toBuffer();

  return base.composite([{
    input: overlay,
    left: Math.max(0, Math.min(zone.x, canvasW - zone.w)),
    top: Math.max(0, Math.min(zone.y, canvasH - zone.h)),
  }]);
}

async function compositePhoto(base: sharp.Sharp, zone: Zone, photoBuffer: Buffer, canvasW: number, canvasH: number): Promise<sharp.Sharp> {
  const w = Math.max(1, zone.w);
  const h = Math.max(1, zone.h);
  const shape = zone.shape ?? 'square';

  let photoSharp = sharp(photoBuffer).resize(w, h, { fit: 'cover', position: 'center' });

  if (shape === 'circle') {
    // Create circular mask
    const mask = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="white"/>
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

  return base.composite([{
    input: photoBuf,
    left: Math.max(0, Math.min(zone.x, canvasW - w)),
    top: Math.max(0, Math.min(zone.y, canvasH - h)),
  }]);
}

async function addWatermark(base: sharp.Sharp, canvasW: number, canvasH: number): Promise<sharp.Sharp> {
  const text = 'Made with Karta';
  const svg = `<svg width="${canvasW}" height="${WATERMARK_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${canvasW}" height="${WATERMARK_HEIGHT}" fill="rgba(0,0,0,0.35)"/>
    <text
      x="${canvasW / 2}"
      y="${WATERMARK_HEIGHT * 0.7}"
      font-family="Inter, sans-serif"
      font-size="20"
      font-weight="500"
      fill="rgba(255,255,255,0.7)"
      text-anchor="middle"
      dominant-baseline="auto"
    >${text}</text>
  </svg>`;
  const svgBuf = await sharp(Buffer.from(svg)).png().toBuffer();

  return base.composite([{
    input: svgBuf,
    left: 0,
    top: canvasH - WATERMARK_HEIGHT,
  }]);
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  const formData = await req.formData();
  const eventId = formData.get('eventId') as string;
  const fieldsJson = formData.get('fields') as string;

  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });

  // Fetch event (public, no auth required)
  const { data: event } = await supabase
    .from('events')
    .select('id, background_url, background_width, background_height, zones, status, user_id, download_count')
    .eq('id', eventId)
    .eq('status', 'published')
    .single();

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Check card generation limit for the event owner
  const { allowed, plan } = await canGenerateCard(event.user_id);
  if (!allowed) {
    return NextResponse.json({ error: 'CARD_LIMIT_REACHED' }, { status: 402 });
  }

  const needsWatermark = PLANS[plan].watermark;

  const zones = (event.zones as unknown as Zone[]) ?? [];
  const fields: Record<string, string> = fieldsJson ? JSON.parse(fieldsJson) : {};
  const canvasW = event.background_width ?? 1080;
  const canvasH = event.background_height ?? 1350;

  // Download background
  const bgBuffer = await fetchBuffer(event.background_url!);

  // Start sharp pipeline
  let pipeline = sharp(bgBuffer).resize(canvasW, canvasH, { fit: 'fill' });

  // Composite zones
  for (const zone of zones) {
    if (zone.hidden) continue;

    if (zone.type === 'text' || zone.type === 'custom') {
      const text = fields[zone.id];
      if (text?.trim()) {
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

  // Watermark
  if (needsWatermark) {
    pipeline = await addWatermark(pipeline, canvasW, canvasH);
  }

  const outputBuffer = await pipeline.png({ quality: 90 }).toBuffer();

  // Save record and counters (fire-and-forget — don't block the response)
  const attendeeName = Object.values(fields)[0] ?? 'Anonymous';
  const newDownloadCount = (event.download_count ?? 0) + 1;

  Promise.all([
    supabase.from('generated_cards').insert({
      event_id: eventId,
      attendee_name: attendeeName,
      attendee_data: fields,
      output_url: null,
    }),
    supabase.from('events').update({ download_count: newDownloadCount }).eq('id', eventId),
    incrementCardsThisMonth(event.user_id),
  ])
    .then(async () => {
      // Fire webhooks + notification emails after DB writes complete
      const { data: owner } = await supabase
        .from('profiles')
        .select('email, notify_downloads')
        .eq('id', event.user_id)
        .single();

      const { data: eventRow } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single();

      await Promise.allSettled([
        fireWebhooks(event.user_id, 'card.generated', {
          event_id: eventId,
          attendee_name: attendeeName,
          download_count: newDownloadCount,
        }),
        maybeSendDownloadMilestone({
          to: owner?.email ?? '',
          eventName: eventRow?.name ?? '',
          eventId,
          downloadCount: newDownloadCount,
          notifyEnabled: owner?.notify_downloads ?? true,
        }),
      ]);
    })
    .catch(() => { /* non-critical */ });

  return new Response(outputBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="card.png"',
      'Cache-Control': 'no-store',
    },
  });
}
