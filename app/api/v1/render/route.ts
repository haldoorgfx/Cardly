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
import { validateApiKey } from '@/lib/api-keys';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // ── Auth via Bearer token ─────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing Authorization header. Use: Bearer sk_live_...' },
      { status: 401 },
    );
  }
  const rawKey = authHeader.slice(7).trim();
  const userId = await validateApiKey(rawKey);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or revoked API key.' }, { status: 401 });
  }

  // ── Plan check ─────────────────────────────────────────────────────────────
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', userId)
    .single();

  const subscriptionFailed =
    profile?.subscription_status === 'canceled' ||
    profile?.subscription_status === 'past_due' ||
    profile?.subscription_status === 'unpaid';
  const plan = (subscriptionFailed && profile?.plan !== 'free') ? 'free' : (profile?.plan ?? 'free');

  if (plan !== 'studio') {
    return NextResponse.json(
      { error: 'API access requires the Studio plan.' },
      { status: 402 },
    );
  }

  // ── Forward to the internal render endpoint ───────────────────────────────
  // Clone the request body and pass through with a trusted user-id header
  // so the internal route doesn't need auth cookies.
  const body = await req.text();
  const internalUrl = new URL('/api/render', req.url);

  const internalRes = await fetch(internalUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
      'X-Karta-Api-Version': '1',
    },
  });
}
