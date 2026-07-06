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
  // ── Auth via Bearer token (Studio plan enforced in the shared helper) ──────
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

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
      'X-Eventera-Api-Version': '1',
    },
  });
}
