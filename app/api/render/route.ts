import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import type { Zone } from '@/types/database';

// Zod schema for a single zone — lenient (passthrough) so unknown future fields survive.
const ZoneSchema = z.object({
  id:     z.string(),
  // NOTE: types the editor can create but this route still cannot draw are
  // dropped by parseZones BELOW, silently. 'label' is handled now; 'shape' and
  // 'image' still need render branches (see the dispatch loop) — until then a
  // designer can place them, see them on the canvas, and they will be absent
  // from the attendee's PNG.
  type:   z.enum(['text', 'photo', 'custom', 'label']),
  x: z.number(), y: z.number(), w: z.number(), h: z.number(),
}).passthrough();

function parseZones(raw: unknown): Zone[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    const result = ZoneSchema.safeParse(item);
    return result.success ? [result.data as unknown as Zone] : [];
  });
}
import { canGenerateCard, incrementCardsThisMonth } from '@/lib/billing/can';
import { PLANS } from '@/lib/billing/plans';
import { fireWebhooks } from '@/lib/webhooks';
import { maybeSendDownloadMilestone, sendCapReachedEmail } from '@/lib/email';
// Font bytes embedded directly in the JS bundle — guaranteed present in every
// Vercel serverless function regardless of file-tracing or CDN behaviour.
import { FONT_DATA } from '@/lib/fonts/embedded-font-data';

const WATERMARK_HEIGHT = 40;
const TMP_FONTS = '/tmp/eventera-fonts';
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FIELD_CHARS = 500;

// Rate limiting for /api/render is now handled by middleware (lib/ratelimit.ts)
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

const ALLOWED_STORAGE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

async function fetchBuffer(url: string | null | undefined): Promise<Buffer> {
  // Null guard — variant has no background yet
  if (!url) throw new Error('NO_BACKGROUND: This card variant has no background image. Please upload a design in the editor first.');

  // SSRF guard — only allow HTTPS requests to our own Supabase storage origin.
  // Validate URL first (throws if malformed), then check hostname separately.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`INVALID_URL: The background image URL is malformed: "${url}"`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('INVALID_URL: Background image URL must use HTTPS.');
  }

  if (ALLOWED_STORAGE_HOST && parsed.hostname !== ALLOWED_STORAGE_HOST) {
    // Log the offending host so it's visible in Vercel logs
    console.warn('[render] SSRF guard blocked host:', parsed.hostname, '— expected:', ALLOWED_STORAGE_HOST);
    throw new Error(`HOST_BLOCKED: Background image host "${parsed.hostname}" is not allowed. Expected "${ALLOWED_STORAGE_HOST}".`);
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`FETCH_FAILED: Background image returned HTTP ${res.status} from ${parsed.hostname}`);
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

  // Case is applied here rather than through Pango's text_transform so it does
  // not depend on the Pango version the deployed sharp binary happens to bundle.
  const cased =
    zone.textTransform === 'uppercase' ? text.toUpperCase()
    : zone.textTransform === 'lowercase' ? text.toLowerCase()
    : text;

  // Arabic / RTL detection — route to Noto Sans Arabic which covers the script.
  const hasArabic = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(cased);
  const fontfile  = resolveFontFile(family, weight, hasArabic);

  // Pango markup: foreground= sets colour; size=Npt scales to N pixels at dpi 72.
  // Only the text content needs escaping — color comes from our own zone config.
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#FFFFFF';

  /**
   * Typography the Card Studio has always offered and this renderer silently
   * dropped: a designer could set tracking, leading and opacity, watch them
   * apply on the canvas, and get a PNG that ignored all three.
   *
   * Every attribute below is emitted ONLY when it differs from the editor's
   * default, so a zone that uses none of them produces exactly the markup this
   * route produced before. Malformed markup makes Pango throw and would take
   * card generation down entirely, so the untouched path stays untouched.
   */
  const attrs: string[] = [`foreground="${safeColor}"`, `size="${size}pt"`];

  // letterSpacing is stored in px (the editor previews it as `${n}px`); Pango
  // wants 1024ths of a point, and dpi is pinned to 72 above so 1pt === 1px.
  const tracking = zone.letterSpacing ?? 0;
  if (Number.isFinite(tracking) && tracking !== 0) {
    attrs.push(`letter_spacing="${Math.round(tracking * 1024)}"`);
  }

  // Editor default is 1.2 and it stores a multiplier, same as Pango.
  const leading = zone.lineHeight ?? 1.2;
  if (Number.isFinite(leading) && leading > 0 && leading !== 1.2) {
    attrs.push(`line_height="${leading}"`);
  }

  const opacityPct = zone.opacity ?? 100;
  if (Number.isFinite(opacityPct) && opacityPct < 100) {
    const clamped = Math.max(1, Math.min(100, Math.round(opacityPct)));
    attrs.push(`alpha="${clamped}%"`);
  }

  const pangoText = `<span ${attrs.join(' ')}>${pangoEscape(cased)}</span>`;

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

  // If the rendered text is larger than the zone (e.g. long text at large font wraps
  // to multiple lines that exceed zone.h), clip it to the zone bounds before compositing.
  // sharp throws "Image to composite must have same dimensions or smaller" otherwise.
  const safeTW = Math.min(tW, zW);
  const safeTH = Math.min(tH, zH);
  const safeTextBuf = (safeTW < tW || safeTH < tH)
    ? await sharp(textBuf).extract({ left: 0, top: 0, width: safeTW, height: safeTH }).toBuffer()
    : textBuf;

  const leftInZone = align === 'center'
    ? Math.max(0, Math.floor((zW - safeTW) / 2))
    : align === 'right'
    ? Math.max(0, zW - safeTW - 8)
    : 8;

  /**
   * Vertical alignment was hardcoded to centre while the editor defaults every
   * new text zone to 'top' — so the mismatch was not an edge case, it was every
   * card anyone designed: text sat where they put it on the canvas and drifted
   * to the middle of its box in the PNG the attendee received.
   *
   * Absent (rather than explicitly 'top') keeps centring. The editor always
   * writes this field, so only genuinely legacy zones lack it, and those were
   * authored against centring — honouring a value they never set would shift
   * cards that are correct today.
   */
  const vAlign = zone.verticalAlign ?? 'center';
  const topInZone =
    vAlign === 'top'    ? Math.min(8, Math.max(0, zH - safeTH))
  : vAlign === 'bottom' ? Math.max(0, zH - safeTH - 8)
  :                       Math.max(0, Math.floor((zH - safeTH) / 2));

  const zoneCanvas = await sharp({
    create: { width: zW, height: zH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: safeTextBuf, left: leftInZone, top: topInZone }]).png().toBuffer();

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

  // .rotate() with no args reads the EXIF Orientation tag and applies the
  // correct rotation before any other operation, then strips the tag.
  // Without this, iPhone photos (EXIF orientation 6) render sideways in the card.
  let photoSharp = sharp(photoBuffer).rotate().resize(w, h, { fit: 'cover', position: 'center' });

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
      text: '<span foreground="#ffffff" size="14pt">Made with Eventera</span>',
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

/** Sniff image magic bytes — don't trust client-declared MIME. Returns the
 *  detected type, or null if it's not an allowed image (JPEG / PNG / WebP). */
function sniffImageType(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'image/png';
  // WebP: "RIFF" .... "WEBP"
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** Validate a decoded photo buffer: size cap + real image type. */
function validatePhotoBuffer(buf: Buffer | null): { ok: true } | { ok: false; error: string } {
  if (!buf || buf.length === 0) return { ok: false, error: 'Photo data is empty or invalid.' };
  if (buf.length > MAX_PHOTO_BYTES) return { ok: false, error: 'Photo is too large. Maximum size is 10 MB.' };
  if (!sniffImageType(buf)) return { ok: false, error: 'Photo must be a JPEG, PNG, or WebP image.' };
  return { ok: true };
}

export async function POST(req: NextRequest) {
  // Rate limiting handled by middleware (lib/ratelimit.ts — 'render' tier: 10 req/60s per IP)
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
  let registrationId: string | null = null;

  if (isJson) {
    const JsonBodySchema = z.object({
      variantId:       z.string().optional(),
      fields:          z.record(z.string(), z.string()).optional(),
      photoDataUrl:    z.string().optional(),
      idempotencyKey:  z.string().optional(),
      registrationId:  z.string().optional(),
    });
    const raw = await req.json().catch(() => ({}));
    const body = JsonBodySchema.safeParse(raw);
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    variantId = body.data.variantId ?? '';
    fields = body.data.fields ?? {};
    idempotencyKey = body.data.idempotencyKey ?? null;
    registrationId = body.data.registrationId ?? null;
    if (body.data.photoDataUrl) {
      jsonPhotoBuffer = decodeDataUrl(body.data.photoDataUrl);
      // Same size + MIME enforcement the multipart path gets — the JSON path
      // previously fed an unbounded, unchecked buffer straight to sharp.
      const check = validatePhotoBuffer(jsonPhotoBuffer);
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    }
  } else {
    formData = await req.formData();
    variantId = (formData.get('variantId') as string) ?? '';
    const fieldsJson = formData.get('fields') as string;
    try {
      const parsed = fieldsJson ? JSON.parse(fieldsJson) : {};
      // Validate: must be a flat object of string values
      const FieldsSchema = z.record(z.string(), z.string());
      fields = FieldsSchema.parse(parsed);
    } catch {
      return NextResponse.json({ error: 'Invalid fields payload' }, { status: 400 });
    }
    idempotencyKey = (formData.get('idempotencyKey') as string | null) ?? null;
    registrationId = (formData.get('registrationId') as string | null) ?? null;
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

  // Cards are for REGISTERED attendees only — no anonymous generation. Require a
  // registrationId that belongs to this event. The id is a server-minted random
  // UUID handed to the client by the registration flow, so holding a valid one
  // for this event proves the caller registered. (The Studio developer API lives
  // in /api/v1/render and is gated by its own API key — this rule is for the
  // public attendee endpoint only.)
  // Authenticated Studio API keys (via /api/v1/render) bypass the attendee
  // registration gate — the developer render API (/api/v1/render) is gated by its
  // own Studio API key, not by attendee registration, so it passes a shared-secret
  // header to skip this gate. FAIL CLOSED: the bypass is only honored when
  // INTERNAL_RENDER_SECRET is actually configured. If it's unset, the header is
  // ignored entirely so a public caller can never guess a default and bypass the
  // gate (which would re-open anonymous card generation).
  const renderSecret = process.env.INTERNAL_RENDER_SECRET;
  const trustedApiRender =
    !!renderSecret && req.headers.get('x-eventera-api-render') === renderSecret;
  if (!trustedApiRender) {
    if (!registrationId) {
      return NextResponse.json({ error: 'REGISTRATION_REQUIRED' }, { status: 403 });
    }
    const { data: registration } = await supabase
      .from('registrations')
      .select('id, event_id')
      .eq('id', registrationId)
      .maybeSingle();
    if (!registration || registration.event_id !== event.id) {
      return NextResponse.json({ error: 'REGISTRATION_REQUIRED' }, { status: 403 });
    }
  }

  // Check card generation limit for the event owner
  const { allowed, plan } = await canGenerateCard(event.user_id);
  if (!allowed) {
    // Notify the owner (best-effort) when their cap is hit
    supabase.from('profiles').select('email, notify_downloads').eq('id', event.user_id).single()
      .then(({ data: owner }) => {
        if (owner?.notify_downloads !== false) {
          sendCapReachedEmail({ to: owner?.email ?? '', eventId: event.id });
        }
      });
    return NextResponse.json({ error: 'CARD_LIMIT_REACHED' }, { status: 402 });
  }

  const needsWatermark = PLANS[plan].watermark;

  const zones = parseZones(variant.zones);
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
      const buf = Buffer.from(await photoFile.arrayBuffer());
      // Validate the actual bytes (size + magic bytes), not just the declared MIME.
      const check = validatePhotoBuffer(buf);
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
      photoBuffers[zone.id] = buf;
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
      } else if (zone.type === 'label') {
        // Static copy authored in Card Studio (e.g. "I'm Attending"). It lives
        // on the zone itself (`sample`), NOT in the attendee-supplied fields —
        // which is why it was rendering for nobody: the zone type wasn't even
        // parsed, so every static headline the designer placed silently
        // vanished from the final card.
        const text = (zone as { sample?: string }).sample ?? '';
        if (text.trim()) {
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

  // Insert generated_cards first (separate from other ops) so we can return the ID
  // to the client as X-Card-Id — enables the attendee to get a permanent re-download link.
  const { data: cardRow } = await supabase.from('generated_cards').insert({
    event_id: eventId,
    variant_id: variantId,
    attendee_name: attendeeName,
    attendee_data: fields,
    output_url: outputUrl,
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
  }).select('id').single();

  const cardId = cardRow?.id ?? null;

  // Fire counters + link card URL — all awaited so they land before the response goes out.
  // (Vercel terminates the function after the response is sent, so void/fire-and-forget is not safe here.)
  await Promise.allSettled([
    supabase.from('events').update({ download_count: newDownloadCount }).eq('id', eventId),
    incrementCardsThisMonth(event.user_id),
    ...(registrationId && outputUrl
      ? [supabase.from('registrations').update({ eventera_card_url: outputUrl }).eq('id', registrationId)]
      : []),
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
      // Client reads this to build a permanent re-download URL
      ...(cardId ? { 'X-Card-Id': cardId } : {}),
    },
  });
}
