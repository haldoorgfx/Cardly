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

export async function POST(req: NextRequest) {
  // ── Auth via Bearer token (Studio plan + full_access scope enforced) ───────
  const auth = await authenticateApiKey(req, 'full_access');
  if (!auth.ok) return auth.response;

  // ── Forward to the internal render endpoint ───────────────────────────────
  // Clone the request body and pass through with a trusted internal header so
  // the internal route skips the attendee registration gate. This header is
  // only ever attached here (server-side, after a valid Studio API key) — the
  // public attendee path can't reach it. Prefer a real secret in prod via
  // INTERNAL_RENDER_SECRET; falls back to a constant for local dev.
  const body = await req.text();
  const internalUrl = new URL('/api/render', req.url);

  const internalRes = await fetch(internalUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-eventera-api-render': process.env.INTERNAL_RENDER_SECRET ?? '1',
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
