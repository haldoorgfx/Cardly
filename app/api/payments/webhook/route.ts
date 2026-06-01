import { NextRequest, NextResponse } from 'next/server';
// Phase 1.6 — Stripe webhook: payment_intent.succeeded → mark registration paid

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', detail: 'Stripe webhook coming in Phase 1.6' },
    { status: 501 }
  );
}
