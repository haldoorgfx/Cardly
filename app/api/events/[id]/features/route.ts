import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { safeExternalUrl } from '@/lib/url/safeUrl';

/**
 * Per-event feature toggles + custom menu.
 * Backed by event_pages.features (jsonb) and event_pages.custom_menu (jsonb)
 * — added in migration 038. Reads/writes degrade gracefully if the columns
 * are not present yet (so the app never hard-errors pre-migration).
 */

const MenuItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(60),
  type: z.enum(['link', 'page']),
  // A menu "link" is rendered as <a href> on the PUBLIC event page, so an
  // organizer-supplied `javascript:`/`data:` URL is a stored-XSS sink — the
  // same class fixed on exhibitor booths. z.string() alone let it through
  // (Zod .url() would too — it only checks that new URL() parses). Normalise
  // to a safe http(s) URL, or reject. Empty stays empty (a "page" item has no
  // url, and a link the organizer cleared should round-trip as unset).
  url: z.string().max(500).optional().default('')
    .transform(v => (v ?? '').trim())
    .superRefine((v, ctx) => {
      if (v && safeExternalUrl(v) === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Menu links must be a valid http(s) URL' });
      }
    })
    .transform(v => (v ? (safeExternalUrl(v) ?? '') : '')),
  content: z.string().max(20_000).optional().default(''),
});

const BodySchema = z.object({
  features: z.record(z.string(), z.boolean()).optional(),
  custom_menu: z.array(MenuItemSchema).max(20).optional(),
});

const MISSING_COLUMN = /column .*(features|custom_menu).* does not exist/i;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  // Cast: features/custom_menu aren't in the generated types until 038 + typegen.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('event_pages')
    .select('features, custom_menu')
    .eq('event_id', params.id)
    .maybeSingle();

  if (error) {
    // Columns not migrated yet — return safe defaults so the UI still loads.
    if (MISSING_COLUMN.test(error.message)) {
      return NextResponse.json({ features: {}, custom_menu: [], migrated: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    features: data?.features ?? {},
    custom_menu: data?.custom_menu ?? [],
    migrated: true,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events').select('id').eq('id', params.id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.features !== undefined) update.features = parsed.data.features;
  if (parsed.data.custom_menu !== undefined) update.custom_menu = parsed.data.custom_menu;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('event_pages')
    .update(update)
    .eq('event_id', params.id)
    .select('features, custom_menu')
    .maybeSingle();

  if (error) {
    if (MISSING_COLUMN.test(error.message)) {
      return NextResponse.json({
        error: 'Database not migrated yet — run migration 038 (event_pages.features + custom_menu) in the Supabase SQL editor.',
        migrated: false,
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ features: data.features ?? {}, custom_menu: data.custom_menu ?? [], migrated: true });
}
