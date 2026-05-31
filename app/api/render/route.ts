import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import type { Zone } from '@/types/database';
import { canGenerateCard, incrementCardsThisMonth } from '@/lib/billing/can';
import { PLANS } from '@/lib/billing/plans';
import { fireWebhooks } from '@/lib/webhooks';
import { maybeSendDownloadMilestone } from '@/lib/email';
// Font bytes embedded directly in the JS bundle — guaranteed present in every
// Vercel serverless function regardless of file-tracing or CDN behaviour.
import { FONT_DATA } from '@/lib/fonts/embedded-font-data';

const WATERMARK_HEIGHT = 40;
const TMP_FONTS = '/tmp/karta-fonts';
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FIELD_CHARS = 500;

// ── Per-IP rate limiter ───────────────────────────────────────────────────────
// In-memory sliding window: 10 renders per IP per 60 s.
// Not distributed (each Lambda instance has its own bucket) but stops trivial abuse.
const rlMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rlMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rlMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}
let fontsWritten = false;

// ── Font setup ────────────────────────────────────────────────────────────────
// Write fonts from the JS bundle to /tmp once per cold-start, then pass those
// paths to sharp's `fontfile` parameter which loads them directly into Pango.

function ensureFonts(): void {
  if (fontsWritten) return;
  fs.mkdirSync(TMP_FONTS, { recursive: true });
  for (const [key, b64] of Object.entries(FONT_DATA)) {
    const dst = path.join(TMP_FONTS, `${key}.ttf`);
    if (!fs.existsSync(dst)) {
      fs.writeFileSync(dst, Buffer.from(b64, 'base64'));
    }
  }
  fontsWritten = true;
}

const FAMILY_MAP: Record<string, string> = {
  'DM Sans':        'dmsans',
  'Inter':          'inter',
  'JetBrains Mono': 'jetbrainsmono',
};

function resolveFontFile(family: string, weight: number, arabic: boolean): string {
  ensureFonts();
  if (arabic) {
    const w = weight >= 600 ? 700 : 400;
    return path.join(TMP_FONTS, `notosansarabic-${w}.ttf`);
  }
  const base = FAMILY_MAP[family] ?? 'inter';
  const available = base === 'jetbrainsmono' ? [400, 500, 700] : [400, 500, 600, 700];
  const snapped = available.reduce((a, b) =>
    Math.abs(b - weight) < Math.abs(a - weight) ? b : a);
  return path.join(TMP_FONTS, `${base}-${snapped}.ttf`);
}

/** Escape text for embedding inside a Pango markup span (content only, not attributes). */
function pangoEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch background image (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// sharp's .composite() does NOT accumulate across calls — the last call wins.
// So each helper returns a SINGLE composite operation, and the caller collects
// them all into one array applied in a single .composite() call.
type Op = sharp.OverlayOptions;

async function buildTextOp(zone: Zone, text: string, canvasW: number, canvasH: number): Promise<Op> {
  const family = zone.font   ?? 'Inter';
  const size   = zone.size   ?? 32;
  const weight = zone.weight ?? 400;
  const color  = zone.color  ?? '#FFFFFF';
  const align  = zone.align  ?? 'left';

  const zW = zone.w;
  const zH = zone.h;

  // Arabic / RTL detection — route to Noto Sans Arabic which covers the script.
  const hasArabic = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);
  const fontfile  = resolveFontFile(family, weight, hasArabic);

  // Pango markup: foreground= sets colour; size=Npt scales to N pixels at dpi 72.
  // Only the text content needs escaping — color comes from our own zone config.
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#FFFFFF';
  const pangoText = `<span foreground="${safeColor}" size="${size}pt">${pangoEscape(text)}</span>`;

  // fontfile= loads the TTF directly into Pango — no fontconfig, no SVG, no base64.
  const sharpAlign = align === 'center' ? 'centre' : align as 'left' | 'right';
  const textBuf = await sharp({
    text: {
      text: pangoText,
      fontfile,
      width: zW - 16,   // sharp wraps at this pixel width (8 px padding each side)
      dpi: 72,          // 1 pt = 1 px; keeps font sizes consistent with the editor
      rgba: true,
      align: sharpAlign,
    },
  }).png().toBuffer();

  // Composite the rendered text block centred inside a zone-sized transparent canvas
  // so the final composite step always receives a buffer with the exact zone dimensions.
  const { width: tW = 0, height: tH = 0 } = await sharp(textBuf).metadata();
  const leftInZone = align === 'center'
    ? Math.max(0, Math.floor((zW - tW) / 2))
    : align === 'right'
    ? Math.max(0, zW - tW - 8)
    : 8;
  const topInZone = Math.max(0, Math.floor((zH - tH) / 2));

  const zoneCanvas = await sharp({
    create: { width: zW, height: zH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: textBuf, left: leftInZone, top: topInZone }]).png().toBuffer();

  return {
    input: zoneCanvas,
    left: Math.max(0, Math.min(Math.round(zone.x), canvasW - zW)),
    top:  Math.max(0, Math.min(Math.round(zone.y), canvasH - zH)),
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
  ensureFonts();
  const fontfile = path.join(TMP_FONTS, 'inter-500.ttf');

  const textBuf = await sharp({
    text: {
      text: '<span foreground="#ffffff" size="14pt">Made with Karta</span>',
      fontfile,
      dpi: 72,
      rgba: true,
      align: 'centre',
    },
  }).png().toBuffer();

  const { width: tW = 0, height: tH = 0 } = await sharp(textBuf).metadata();

  // Dark semi-transparent bar with text centred on it
  const bar = await sharp({
    create: { width: canvasW, height: WATERMARK_HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 90 } },
  }).composite([{
    input: textBuf,
    left: Math.max(0, Math.floor((canvasW - tW) / 2)),
    top:  Math.max(0, Math.floor((WATERMARK_HEIGHT - tH) / 2)),
  }]).png().toBuffer();

  return { input: bar, left: 0, top: canvasH - WATERMARK_HEIGHT };
}

/** Decode a `data:image/...;base64,XXXX` data URL (or a bare base64 string) to a Buffer. */
function decodeDataUrl(dataUrl: string): Buffer | null {
  if (!dataUrl) return null;
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 && dataUrl.slice(0, comma).includes('base64') ? dataUrl.slice(comma + 1) : dataUrl;
  try { return Buffer.from(b64, 'base64'); } catch { return null; }
}

export async function POST(req: NextRequest) {
  // Rate limit by IP — stops trivial abuse of this public endpoint
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute and try again.' }, { status: 429 });
  }

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

  let idempotencyKey: string | null = null;

  if (isJson) {
    const body = await req.json().catch(() => ({})) as {
      variantId?: string; fields?: Record<string, string>; photoDataUrl?: string; idempotencyKey?: string;
    };
    variantId = body.variantId ?? '';
    fields = body.fields ?? {};
    idempotencyKey = body.idempotencyKey ?? null;
    if (body.photoDataUrl) jsonPhotoBuffer = decodeDataUrl(body.photoDataUrl);
  } else {
    formData = await req.formData();
    variantId = (formData.get('variantId') as string) ?? '';
    const fieldsJson = formData.get('fields') as string;
    fields = fieldsJson ? JSON.parse(fieldsJson) : {};
    idempotencyKey = (formData.get('idempotencyKey') as string | null) ?? null;
  }

  // Idempotency check — if this key was already rendered, return 409 immediately.
  // The client still holds the blob from the first successful render, so it can
  // show a friendly message without double-counting the cap.
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('generated_cards')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'DUPLICATE_SUBMISSION' }, { status: 409 });
    }
  }

  if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });

  // Cap field values — prevents giant text payloads from blowing up the SVG renderer
  for (const key of Object.keys(fields)) {
    if (typeof fields[key] === 'string' && fields[key].length > MAX_FIELD_CHARS) {
      fields[key] = fields[key].slice(0, MAX_FIELD_CHARS);
    }
  }

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
      if (!photoFile) continue;
      if (photoFile.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ error: 'Photo is too large. Maximum size is 10 MB.' }, { status: 400 });
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(photoFile.type)) {
        return NextResponse.json({ error: 'Photo must be a JPEG, PNG, or WebP image.' }, { status: 400 });
      }
      photoBuffers[zone.id] = Buffer.from(await photoFile.arrayBuffer());
    }
  }

  // Download background + build composites — wrap the whole pipeline so a
  // bad background URL or sharp failure returns a clean JSON error, not a 500.
  let outputBuffer: Buffer;
  try {
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

    outputBuffer = await sharp(bgBuffer)
      .resize(canvasW, canvasH, { fit: 'fill' })
      .composite(ops)
      .png({ quality: 90 })
      .toBuffer();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Render failed';
    console.error('[render]', msg);
    return NextResponse.json({ error: 'RENDER_FAILED', detail: msg }, { status: 500 });
  }

  // Persist the generated PNG so attendees can recover their card later.
  // Ensure the bucket exists first (idempotent — no-op if already there).
  const attendeeName = Object.values(fields)[0] ?? 'Anonymous';
  const newDownloadCount = (event.download_count ?? 0) + 1;
  const cardPath = `${eventId}/${crypto.randomUUID()}.png`;

  await supabase.storage.createBucket('generated-cards', { public: true }).catch(() => {});
  const { error: uploadErr } = await supabase.storage
    .from('generated-cards')
    .upload(cardPath, outputBuffer, { contentType: 'image/png', upsert: false, cacheControl: '31536000' });
  const outputUrl = uploadErr
    ? null
    : supabase.storage.from('generated-cards').getPublicUrl(cardPath).data.publicUrl;

  // Save record and counters. AWAIT these — on serverless the function can
  // freeze right after the response is sent, dropping any detached promises,
  // which would silently lose download counts and generated_cards rows.
  await Promise.allSettled([
    supabase.from('generated_cards').insert({
      event_id: eventId,
      variant_id: variantId,
      attendee_name: attendeeName,
      attendee_data: fields,
      output_url: outputUrl,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
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
