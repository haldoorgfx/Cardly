import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { TEMPLATE_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import { buildSVG, TEMPLATE_CONFIGS, W, H } from '@/lib/templates/svgs';

/**
 * POST /api/admin/rebrand-backgrounds
 *
 * One-off maintenance: re-rasterises the frozen background PNGs for events that
 * were created from a BUILT-IN template before the Cardly → Eventera rebrand.
 *
 * Why this exists:
 *   The built-in template path (app/api/templates/use, .../variants/from-template)
 *   rasterises `buildSVG()` to a PNG at event-creation time and stores it in the
 *   `event-backgrounds` bucket. The variant's `background_url` then points at that
 *   frozen PNG. `buildSVG()` bakes the watermark ("MADE WITH EVENTERA") and other
 *   static branding into those pixels. Events created before the rebrand still
 *   carry the OLD baked branding ("MADE WITH CARDLY", "CARDLY · TEMPLATE"), because
 *   the PNG was frozen from the old code. Re-running the current `buildSVG()` and
 *   overwriting the pointer fixes every affected preview + every future render.
 *
 * Safety — this ONLY touches platform-owned template art:
 *   - It matches the built-in filename pattern `.../event-backgrounds/<user>/…template-<key>-<ts>.png`
 *     where <key> is a known TEMPLATE_CONFIGS id. Custom organizer uploads land at
 *     `<user>/<timestamp>.png` (no `template-` segment) and are never matched.
 *   - DB-managed (admin) templates live in the `templates` bucket, not `event-backgrounds`,
 *     so their copies are never matched here either.
 *
 * Params (JSON body or query string):
 *   dryRun  — default TRUE. When true, reports what WOULD change without writing.
 *   eventId — optional, restrict to a single event.
 *   slug    — optional, restrict to a single event by slug.
 *
 * Returns a per-variant report so you can eyeball it before running for real.
 */

// Match `…/template-<key>-<timestamp>.png`. Built-in template ids are lowercase
// alphanumeric with no hyphens (e.g. "sunrise", "faith", "sport100", "womentech"),
// so the id capture is unambiguous even when the path is prefixed with an event uuid.
const BUILTIN_BG_RE = /template-([a-z0-9]+)-\d+\.png$/;

const BUCKET = 'event-backgrounds';

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

type Report = {
  variantId: string;
  eventId: string;
  eventName: string | null;
  templateId: string;
  oldUrl: string;
  newUrl: string | null;
  status: 'would-rebrand' | 'rebranded' | 'skipped' | 'error';
  reason?: string;
};

export async function POST(req: NextRequest) {
  const auth = await getAuthorizedUser(TEMPLATE_MANAGE);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // Params from JSON body (preferred) or query string.
  let body: { dryRun?: boolean; eventId?: string; slug?: string } = {};
  try { body = await req.json(); } catch { /* no body — fall back to query */ }
  const url = new URL(req.url);
  const dryRun = body.dryRun ?? (url.searchParams.get('dryRun') !== 'false');
  const filterEventId = body.eventId ?? url.searchParams.get('eventId') ?? null;
  const filterSlug = body.slug ?? url.searchParams.get('slug') ?? null;

  const admin = createAdminClient();

  // Resolve a slug filter to an event id up front.
  let scopedEventId = filterEventId;
  if (!scopedEventId && filterSlug) {
    const { data: ev } = await admin.from('events').select('id').eq('slug', filterSlug).single();
    if (!ev) return NextResponse.json({ error: `No event with slug "${filterSlug}"` }, { status: 404 });
    scopedEventId = ev.id;
  }

  // Pull variants (optionally scoped to one event).
  let q = admin
    .from('event_variants')
    .select('id, event_id, background_url');
  if (scopedEventId) q = q.eq('event_id', scopedEventId);
  const { data: variants, error: varErr } = await q;
  if (varErr) return NextResponse.json({ error: varErr.message }, { status: 500 });

  // Look up owning events (for storage folder = user_id, and a friendly name).
  const eventIds = Array.from(new Set((variants ?? []).map(v => v.event_id)));
  const eventMap = new Map<string, { user_id: string; name: string | null }>();
  if (eventIds.length) {
    const { data: events } = await admin
      .from('events')
      .select('id, user_id, name')
      .in('id', eventIds);
    for (const e of events ?? []) eventMap.set(e.id, { user_id: e.user_id, name: e.name });
  }

  const report: Report[] = [];

  for (const v of variants ?? []) {
    const bgUrl = v.background_url;
    if (!bgUrl) continue;

    const storagePath = extractStoragePath(bgUrl);
    if (!storagePath) continue; // not an event-backgrounds asset (e.g. DB template) → skip silently

    const m = storagePath.match(BUILTIN_BG_RE);
    if (!m) continue; // custom upload or unknown pattern → leave untouched

    const templateId = m[1];
    const config = TEMPLATE_CONFIGS[templateId];
    const ev = eventMap.get(v.event_id);

    if (!config) {
      report.push({
        variantId: v.id, eventId: v.event_id, eventName: ev?.name ?? null,
        templateId, oldUrl: bgUrl, newUrl: null,
        status: 'skipped', reason: 'not a known built-in template id',
      });
      continue;
    }

    if (dryRun) {
      report.push({
        variantId: v.id, eventId: v.event_id, eventName: ev?.name ?? null,
        templateId, oldUrl: bgUrl, newUrl: null, status: 'would-rebrand',
      });
      continue;
    }

    try {
      // Re-rasterise from the CURRENT buildSVG (correct "MADE WITH EVENTERA" branding).
      const svgStr = buildSVG(templateId, config.text);
      const pngBuf = await sharp(Buffer.from(svgStr)).png().toBuffer();

      const folder = ev?.user_id ?? 'platform';
      const newPath = `${folder}/rebrand-${v.event_id}-template-${templateId}-${Date.now()}.png`;
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(newPath, pngBuf, { contentType: 'image/png', upsert: false, cacheControl: '31536000' });
      if (upErr) throw new Error(upErr.message);

      const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(newPath);

      const { error: updErr } = await admin
        .from('event_variants')
        .update({
          background_url: urlData.publicUrl,
          background_width: W,
          background_height: H,
        })
        .eq('id', v.id);
      if (updErr) throw new Error(updErr.message);

      report.push({
        variantId: v.id, eventId: v.event_id, eventName: ev?.name ?? null,
        templateId, oldUrl: bgUrl, newUrl: urlData.publicUrl, status: 'rebranded',
      });
    } catch (err) {
      report.push({
        variantId: v.id, eventId: v.event_id, eventName: ev?.name ?? null,
        templateId, oldUrl: bgUrl, newUrl: null,
        status: 'error', reason: err instanceof Error ? err.message : 'rebrand failed',
      });
    }
  }

  const summary = {
    dryRun,
    scannedVariants: variants?.length ?? 0,
    matched: report.length,
    rebranded: report.filter(r => r.status === 'rebranded').length,
    wouldRebrand: report.filter(r => r.status === 'would-rebrand').length,
    errors: report.filter(r => r.status === 'error').length,
  };

  if (!dryRun && summary.rebranded > 0) {
    await logAudit(user, 'template.rebrand_backgrounds', 'template', scopedEventId ?? 'all', {
      after: summary,
    });
  }

  return NextResponse.json({ summary, report });
}
