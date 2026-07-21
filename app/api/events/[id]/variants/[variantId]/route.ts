import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function verifyOwner(eventId: string, userId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', userId).single();
  return !!data;
}

// Bounds for values that flow straight into sharp()'s canvas/zone compositing
// and Pango text sizing at render time (app/api/render/route.ts). Every
// registered attendee can trigger a render of any variant, so an
// unbounded canvas/zone/font-size here is a repeatable memory-exhaustion
// vector, not just a one-time bad write.
const MAX_CANVAS_DIM = 6000;
const MAX_ZONES = 60;
const MAX_ZONE_DIM = 10000; // generous — zones can sit outside the visible canvas by design
const MAX_FONT_SIZE = 500; // pt
const MAX_FONT_WEIGHT = 1000;

function validateVariantPatch(body: Record<string, unknown>): string | null {
  if ('background_width' in body) {
    const w = body.background_width;
    if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0 || w > MAX_CANVAS_DIM) {
      return `background_width must be a number between 1 and ${MAX_CANVAS_DIM}`;
    }
  }
  if ('background_height' in body) {
    const h = body.background_height;
    if (typeof h !== 'number' || !Number.isFinite(h) || h <= 0 || h > MAX_CANVAS_DIM) {
      return `background_height must be a number between 1 and ${MAX_CANVAS_DIM}`;
    }
  }
  if ('zones' in body) {
    const zones = body.zones;
    if (!Array.isArray(zones)) return 'zones must be an array';
    if (zones.length > MAX_ZONES) return `A design can have at most ${MAX_ZONES} zones`;
    for (const z of zones) {
      if (!z || typeof z !== 'object') continue;
      const zone = z as Record<string, unknown>;
      for (const dim of ['x', 'y', 'w', 'h'] as const) {
        const v = zone[dim];
        if (typeof v === 'number' && (!Number.isFinite(v) || Math.abs(v) > MAX_ZONE_DIM)) {
          return `Zone ${dim} must be within ±${MAX_ZONE_DIM}`;
        }
      }
      // w/h must be positive. The renderer sizes a text zone's wrap width as
      // (w - 16) and builds each zone canvas with sharp({create:{width:w...}});
      // a zero or negative w/h makes sharp throw ("Expected positive integer
      // for text.width" / "valid width, height"), which the render route
      // catches as a 500 — so one zone with a cleared or negative dimension
      // takes down card generation for every attendee of that variant. Reject
      // it at the save boundary (in addition to the editor clamp) so a stale
      // client or a direct API call can't persist an un-renderable design.
      for (const dim of ['w', 'h'] as const) {
        const v = zone[dim];
        if (typeof v === 'number' && v <= 0) {
          return `Zone ${dim} must be greater than 0`;
        }
      }
      if (typeof zone.size === 'number' && (!Number.isFinite(zone.size) || zone.size <= 0 || zone.size > MAX_FONT_SIZE)) {
        return `Zone font size must be between 1 and ${MAX_FONT_SIZE}`;
      }
      if (typeof zone.weight === 'number' && (!Number.isFinite(zone.weight) || zone.weight <= 0 || zone.weight > MAX_FONT_WEIGHT)) {
        return `Zone font weight must be between 1 and ${MAX_FONT_WEIGHT}`;
      }
    }
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  if (!(await verifyOwner(id, user.id, admin))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();

  const validationError = validateVariantPatch(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const allowed = ['variant_name', 'zones', 'background_url', 'background_width', 'background_height'] as const;
  type UpdateKey = typeof allowed[number];
  const patch: Partial<Record<UpdateKey, unknown>> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  // Optimistic concurrency: if caller sends updated_at, reject if the row
  // has been modified since then — prevents last-write-wins on concurrent edits.
  const expectedUpdatedAt: string | undefined = body.updated_at;
  let query = admin
    .from('event_variants')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ...patch as any, updated_at: new Date().toISOString() })
    .eq('id', variantId)
    .eq('event_id', id);

  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt);
  }

  const { data, error } = await query.select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) {
    return NextResponse.json(
      { error: 'Conflict: this variant was modified by another session. Please refresh.' },
      { status: 409 }
    );
  }
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { id, variantId } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  if (!(await verifyOwner(id, user.id, admin))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Don't allow deleting the last variant
  const { count } = await admin
    .from('event_variants')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id);

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last variant' }, { status: 400 });
  }

  const { error } = await admin
    .from('event_variants')
    .delete()
    .eq('id', variantId)
    .eq('event_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
