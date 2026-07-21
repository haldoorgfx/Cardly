/**
 * Template application — the single write-path that turns a chosen card
 * template into an `event_variants` row on an event that ALREADY EXISTS.
 *
 * WHY THIS EXISTS
 * ---------------
 * There used to be a second event-creation route (`/api/templates/use`) that
 * created the `events` row itself. It did not create the matching `event_pages`
 * row, so a create-from-template event was a broken shell: no public page, no
 * `/e/[slug]/register` route, blank dates on the Publish screen, and — if the
 * organizer published anyway — `ensurePublicEventPage` silently invented dates
 * 30 days in the future. It also duplicated (and drifted from) the plan-limit
 * check in `lib/billing/can.ts`.
 *
 * The fix is ordering, not patching: an event is created ONCE, by
 * `/api/events/create-basic`, with validated dates and an `event_pages` row.
 * Only then is a template applied on top. This module is that second half, and
 * it is deliberately incapable of creating an event.
 *
 * SERVER-ONLY — uses the service-role admin client.
 */

import sharp from 'sharp';
import { createAdminClient } from '@/lib/supabase/server';
import type { Json, Zone } from '@/types/database';
import {
  buildSVG,
  TEMPLATE_CONFIGS,
  W, H,
  ZONE_PHOTO, ZONE_NAME, ZONE_TITLE, ZONE_ORG,
} from '@/lib/templates/svgs';
import { injectSvgFonts } from '@/lib/templates/svg-fonts';
import type { Plan } from '@/lib/billing/plans';

/**
 * Zone factory — positions come from the shared SVG constants so the editor
 * canvas, the rasterized card and the /templates preview all agree.
 *
 * This was copy-pasted in three routes and had already drifted; it lives here
 * now so a change to the card layout lands everywhere at once.
 */
export function getTemplateZones(accent: string, light: boolean): Zone[] {
  const nameColor  = light ? '#1A1A1A'           : '#FFFFFF';
  const titleColor = light ? 'rgba(0,0,0,0.55)'  : 'rgba(255,255,255,0.65)';
  const orgColor   = light ? 'rgba(0,0,0,0.40)'  : (accent.startsWith('rgba') ? 'rgba(255,255,255,0.45)' : `${accent}BB`);

  return [
    {
      id: 'z-photo',
      type: 'photo',
      label: 'Headshot',
      x: ZONE_PHOTO.x, y: ZONE_PHOTO.y, w: ZONE_PHOTO.w, h: ZONE_PHOTO.h,
      shape: 'circle',
      photoBorderColor: accent,
      photoBorderWidth: 4,
    },
    {
      id: 'z-name',
      type: 'text',
      label: 'Full Name',
      x: ZONE_NAME.x, y: ZONE_NAME.y, w: ZONE_NAME.w, h: ZONE_NAME.h,
      font: 'DM Sans', size: 56, weight: 700,
      color: nameColor, align: 'center',
      required: true, placeholder: 'Your name',
      lineHeight: 1.1, letterSpacing: -1,
    },
    {
      id: 'z-title',
      type: 'text',
      label: 'Title / Role',
      x: ZONE_TITLE.x, y: ZONE_TITLE.y, w: ZONE_TITLE.w, h: ZONE_TITLE.h,
      font: 'Inter', size: 26, weight: 400,
      color: titleColor, align: 'center',
      placeholder: 'Your title or role', lineHeight: 1.2,
    },
    {
      id: 'z-org',
      type: 'text',
      label: 'Organization',
      x: ZONE_ORG.x, y: ZONE_ORG.y, w: ZONE_ORG.w, h: ZONE_ORG.h,
      font: 'Inter', size: 22, weight: 400,
      color: orgColor, align: 'center',
      placeholder: 'Your organization', lineHeight: 1.2,
    },
  ];
}

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

export type TemplateCheck =
  | { ok: true; kind: 'builtin' | 'db' }
  | { ok: false; error: string; status: number };

/**
 * Validate a template id BEFORE any row is written.
 *
 * Creation calls this first so that an unknown id, an unpublished DB template,
 * or a Studio-only template picked by a Free user fails with nothing left
 * behind — rather than after the event row already exists.
 */
export async function checkTemplate(templateId: string, plan: Plan): Promise<TemplateCheck> {
  if (!templateId) return { ok: false, error: 'No template selected.', status: 400 };

  if (!templateId.startsWith('db:')) {
    if (!TEMPLATE_CONFIGS[templateId]) {
      return { ok: false, error: 'That template no longer exists.', status: 400 };
    }
    return { ok: true, kind: 'builtin' };
  }

  const admin = createAdminClient();
  const { data: tpl } = await admin
    .from('templates')
    .select('min_plan')
    .eq('id', templateId.slice(3))
    .eq('published', true)
    .single();

  if (!tpl) return { ok: false, error: 'That template no longer exists.', status: 404 };
  if ((PLAN_RANK[plan] ?? 0) < (PLAN_RANK[tpl.min_plan] ?? 0)) {
    return { ok: false, error: 'PLAN_LIMIT', status: 402 };
  }
  return { ok: true, kind: 'db' };
}

/**
 * Apply a template to an existing event as its first card variant.
 *
 * Returns an error string rather than throwing: by the time this runs the event
 * itself is real and valid, so a template failure is a soft "your event was
 * created, the design didn't apply" — never a reason to fail the creation.
 */
export async function applyTemplateToEvent(params: {
  eventId: string;
  userId: string;
  templateId: string;
  plan: Plan;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { eventId, userId, templateId, plan } = params;

  const check = await checkTemplate(templateId, plan);
  if (!check.ok) return { ok: false, error: check.error };

  const admin = createAdminClient();

  // Position after any variant the event already has, so applying a template
  // never silently collides with an existing card design.
  const { data: existing } = await admin
    .from('event_variants')
    .select('position')
    .eq('event_id', eventId)
    .order('position', { ascending: false })
    .limit(1);
  const position = (existing?.[0]?.position ?? -1) + 1;

  /* ── DB-backed (admin-managed) template ─────────────────────── */
  if (check.kind === 'db') {
    const { data: tpl } = await admin
      .from('templates')
      .select('name, background_url, dimensions, zones')
      .eq('id', templateId.slice(3))
      .eq('published', true)
      .single();
    if (!tpl) return { ok: false, error: 'That template no longer exists.' };

    const dims = (tpl.dimensions as { width?: number; height?: number } | null) ?? {};
    const { error } = await admin.from('event_variants').insert({
      event_id: eventId,
      variant_name: 'Attendee',
      variant_slug: `attendee-${crypto.randomUUID().slice(0, 6)}`,
      background_url: tpl.background_url,
      background_width: dims.width ?? W,
      background_height: dims.height ?? H,
      zones: (tpl.zones ?? []) as Json,
      position,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  /* ── Built-in (code-defined) template ───────────────────────── */
  const config = TEMPLATE_CONFIGS[templateId];
  if (!config) return { ok: false, error: 'That template no longer exists.' };

  // SVG → PNG via sharp, server-side (CLAUDE.md: never browser rendering).
  const svgStr = injectSvgFonts(buildSVG(templateId, config.text));
  const pngBuf = await sharp(Buffer.from(svgStr)).png().toBuffer();

  const storagePath = `${userId}/${eventId}-template-${templateId}-${Date.now()}.png`;
  const { error: uploadErr } = await admin.storage
    .from('event-backgrounds')
    .upload(storagePath, pngBuf, { contentType: 'image/png', upsert: false, cacheControl: '31536000' });
  if (uploadErr) return { ok: false, error: uploadErr.message };

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(storagePath);

  const { error: varErr } = await admin.from('event_variants').insert({
    event_id: eventId,
    variant_name: 'Attendee',
    variant_slug: `attendee-${crypto.randomUUID().slice(0, 6)}`,
    background_url: urlData.publicUrl,
    background_width: W,
    background_height: H,
    zones: getTemplateZones(config.accent, config.light ?? false) as unknown as Json,
    position,
  });

  if (varErr) {
    // Don't leave a paid-for storage object behind for a variant that never landed.
    try { await admin.storage.from('event-backgrounds').remove([storagePath]); } catch { /* best-effort */ }
    return { ok: false, error: varErr.message };
  }
  return { ok: true };
}
