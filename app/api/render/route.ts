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

// sharp's .composite() does NOT accumulate across calls — the last call wins.
// So each helper returns a SINGLE composite operation, and the caller collects
// them all into one array applied in a single .composite() call.
type Op = sharp.OverlayOptions;

async function buildTextOp(zone: Zone, text: string, canvasW: number, canvasH: number): Promise<Op> {
  const font = zone.font ?? 'sans-serif';
  const size = zone.size ?? 32;
  const weight = zone.weight ?? 400;
  const color = zone.color ?? '#FFFFFF';
  const align = zone.align ?? 'left';
  const letterSpacing = zone.letterSpacing ?? 0;

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
      y="${svgHeight * 0.72}"
      font-family="${font}, sans-serif"
      font-size="${size}"
      font-weight="${weight}"
      fill="${color}"
      text-anchor="${textAnchor}"
      letter-spacing="${letterSpacing}"
      dominant-baseline="auto"
    >${escapedText}</text>
  </svg>`;

  const overlay = await sharp(Buffer.from(svg)).png().toBuffer();

  return {
    input: overlay,
    left: Math.max(0, Math.min(Math.round(zone.x), canvasW - zone.w)),
    top: Math.max(0, Math.min(Math.round(zone.y), canvasH - zone.h)),
  };
}

async function buildPhotoOp(zone: Zone, photoBuffer: Buffer, canvasW: number, canvasH: number): Promise<Op> {
  const w = Math.max(1, zone.w);
  const h = Math.max(1, zone.h);
  const shape = zone.shape ?? 'square';

  let photoSharp = sharp(photoBuffer).resize(w, h, { fit: 'cover', position: 'center' });

  if (shape === 'circle') {
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

  return {
    input: photoBuf,
    left: Math.max(0, Math.min(Math.round(zone.x), canvasW - w)),
    top: Math.max(0, Math.min(Math.round(zone.y), canvasH - h)),
  };
}

async function buildWatermarkOp(canvasW: number, canvasH: number): Promise<Op> {
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

  return {
    input: svgBuf,
    left: 0,
    top: canvasH - WATERMARK_HEIGHT,
  };
}

/** Decode a `data:image/...;base64,XXXX` data URL (or a bare base64 string) to a Buffer. */
function decodeDataUrl(dataUrl: string): Buffer | null {
  if (!dataUrl) return null;
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 && dataUrl.slice(0, comma).includes('base64') ? dataUrl.slice(comma + 1) : dataUrl;
  try { return Buffer.from(b64, 'base64'); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  // The attendee page POSTs multipart/form-data (photo files); the developer
  // API (/api/v1/render) POSTs application/json with a base64 photoDataUrl.
  // Support both.
  const contentType = req.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  let variantId: string;
  let fields: Record<string, string> = {};
  // zoneId → photo Buffer
  const photoBuffers: Record<string, Buffer> = {};
  // For JSON callers, a single photoDataUrl is mapped to the first photo zone.
  let jsonPhotoBuffer: Buffer | null = null;
  let formData: FormData | null = null;

  if (isJson) {
    const body = await req.json().catch(() => ({})) as {
      variantId?: string; fields?: Record<string, string>; photoDataUrl?: string;
    };
    variantId = body.variantId ?? '';
    fields = body.fields ?? {};
    if (body.photoDataUrl) jsonPhotoBuffer = decodeDataUrl(body.photoDataUrl);
  } else {
    formData = await req.formData();
    variantId = (formData.get('variantId') as string) ?? '';
    const fieldsJson = formData.get('fields') as string;
    fields = fieldsJson ? JSON.parse(fieldsJson) : {};
  }

  if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });

  // Fetch the variant (has background + zones)
  const { data: variant } = await supabase
    .from('event_variants')
    .select('id, event_id, background_url, background_width, background_height, zones')
    .eq('id', variantId)
    .single();

  if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

  // Fetch the parent event (for status check, user_id, download_count)
  const { data: event } = await supabase
    .from('events')
    .select('id, status, user_id, download_count')
    .eq('id', variant.event_id)
    .eq('status', 'published')
    .single();

  if (!event) return NextResponse.json({ error: 'Event not found or not published' }, { status: 404 });

  // Check card generation limit for the event owner
  const { allowed, plan } = await canGenerateCard(event.user_id);
  if (!allowed) {
    return NextResponse.json({ error: 'CARD_LIMIT_REACHED' }, { status: 402 });
  }

  const needsWatermark = PLANS[plan].watermark;

  const zones = (variant.zones as unknown as Zone[]) ?? [];
  const canvasW = variant.background_width ?? 1080;
  const canvasH = variant.background_height ?? 1350;
  const eventId = event.id;

  // Resolve photo buffers per zone. Multipart: photo_<zoneId> files.
  // JSON: a single photoDataUrl mapped to the first photo zone.
  const firstPhotoZoneId = zones.find(z => z.type === 'photo' && !z.hidden)?.id;
  if (jsonPhotoBuffer && firstPhotoZoneId) {
    photoBuffers[firstPhotoZoneId] = jsonPhotoBuffer;
  }
  if (formData) {
    for (const zone of zones) {
      if (zone.type !== 'photo') continue;
      const photoFile = formData.get(`photo_${zone.id}`) as File | null;
      if (photoFile) photoBuffers[zone.id] = Buffer.from(await photoFile.arrayBuffer());
    }
  }

  // Download background
  const bgBuffer = await fetchBuffer(variant.background_url!);

  // Collect every overlay into ONE array. sharp's .composite() does not
  // accumulate across calls, so all zones + watermark must go in a single call,
  // applied in z-order (array order = bottom-to-top, matching the editor).
  const ops: Op[] = [];

  for (const zone of zones) {
    if (zone.hidden) continue;

    if (zone.type === 'text' || zone.type === 'custom') {
      const text = fields[zone.id];
      if (text?.trim()) {
        ops.push(await buildTextOp(zone, text, canvasW, canvasH));
      }
    } else if (zone.type === 'photo') {
      const photoBuf = photoBuffers[zone.id];
      if (photoBuf) {
        ops.push(await buildPhotoOp(zone, photoBuf, canvasW, canvasH));
      }
    }
  }

  // Watermark goes on top, last
  if (needsWatermark) {
    ops.push(await buildWatermarkOp(canvasW, canvasH));
  }

  const outputBuffer = await sharp(bgBuffer)
    .resize(canvasW, canvasH, { fit: 'fill' })
    .composite(ops)
    .png({ quality: 90 })
    .toBuffer();

  // Save record and counters. AWAIT these — on serverless the function can
  // freeze right after the response is sent, dropping any detached promises,
  // which would silently lose download counts and generated_cards rows.
  const attendeeName = Object.values(fields)[0] ?? 'Anonymous';
  const newDownloadCount = (event.download_count ?? 0) + 1;

  await Promise.allSettled([
    supabase.from('generated_cards').insert({
      event_id: eventId,
      variant_id: variantId,
      attendee_name: attendeeName,
      attendee_data: fields,
      output_url: null,
    }),
    supabase.from('events').update({ download_count: newDownloadCount }).eq('id', eventId),
    incrementCardsThisMonth(event.user_id),
  ]);

  // Webhooks + notification emails are best-effort — don't block the PNG response.
  Promise.all([
    supabase.from('profiles').select('email, notify_downloads').eq('id', event.user_id).single(),
    supabase.from('events').select('name').eq('id', eventId).single(),
  ])
    .then(([{ data: owner }, { data: eventRow }]) =>
      Promise.allSettled([
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
      ]),
    )
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
