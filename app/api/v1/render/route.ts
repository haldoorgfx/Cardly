/**
 * POST /api/v1/render
 *
 * Public API endpoint authenticated via Bearer API key.
 * Accepts the same body as /api/render and returns the same PNG response.
 * Studio plan only.
 *
 * Headers:
 *   Authorization: Bearer sk_live_XXXX
 *
 * Body: { eventId, variantId?, fields: { zoneId: value, … }, photoDataUrl? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export async function POST(req: NextRequest) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  // ── Auth via Bearer token (Studio plan + full_access scope enforced) ───────
  const auth = await authenticateApiKey(req, 'full_access', { rateTier: 'apiKeyRender' });
  if (!auth.ok) return auth.response;

  const body = await req.text();

  // ── TENANT ISOLATION ──────────────────────────────────────────────────────
  // eventId/variantId come from the caller. The internal render route resolves
  // the event FROM the variant and only requires it to be published — so
  // without this check any Studio key holder could render against another
  // account's event: burning that owner's card quota, incrementing their
  // download_count, writing a generated_cards row under their event and firing
  // their webhooks. Resolve the owner and require it to be this key's account.
  let parsed: { eventId?: string; variantId?: string };
  try {
    parsed = JSON.parse(body || '{}');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  let ownerId: string | null = null;
  if (parsed.variantId) {
    const { data } = await admin
      .from('event_variants')
      .select('events!inner(user_id)')
      .eq('id', parsed.variantId)
      .maybeSingle();
    ownerId = data?.events?.user_id ?? null;
  } else if (parsed.eventId) {
    const { data } = await admin
      .from('events')
      .select('user_id')
      .eq('id', parsed.eventId)
      .maybeSingle();
    ownerId = data?.user_id ?? null;
  }

  if (!ownerId) {
    return NextResponse.json({ error: 'Event or variant not found' }, { status: 404 });
  }
  if (ownerId !== auth.userId) {
    return NextResponse.json(
      { error: 'That event belongs to another account' },
      { status: 403 },
    );
  }

  // ── Forward to the internal render endpoint ───────────────────────────────
  // Clone the request body and pass through with a trusted internal header so
  // the internal route skips the attendee registration gate. This header is
  // only ever attached here (server-side, after a valid Studio API key) — the
  // public attendee path can't reach it.
  //
  // The internal route fails CLOSED when INTERNAL_RENDER_SECRET is unset, so a
  // missing env var previously turned every documented call into a confusing
  // REGISTRATION_REQUIRED 403. Surface it as an explicit config error instead.
  const renderSecret = process.env.INTERNAL_RENDER_SECRET;
  if (!renderSecret) {
    return NextResponse.json(
      { error: 'The render API is not configured on this deployment' },
      { status: 503 },
    );
  }
  const internalUrl = new URL('/api/render', req.url);

  const internalRes = await fetch(internalUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-eventera-api-render': renderSecret,
    },
    body,
  });

  // Stream the response (PNG binary or JSON error) back to the caller
  const resBody = await internalRes.arrayBuffer();
  return new NextResponse(resBody, {
    status: internalRes.status,
    headers: {
      'Content-Type': internalRes.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': internalRes.headers.get('content-disposition') ?? '',
      'X-Eventera-Api-Version': '1',
    },
  });
}
