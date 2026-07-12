import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lightweight liveness probe for uptime monitors / load balancers.
// Returns 200 + a small JSON payload. Intentionally does no DB work so it stays
// fast and can't be turned into a load vector.
export function GET() {
  return NextResponse.json(
    { status: 'ok', ts: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
