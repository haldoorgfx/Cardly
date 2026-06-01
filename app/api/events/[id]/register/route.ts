import { NextRequest, NextResponse } from 'next/server';
// Phase 1.5 / 1.6 — registration + payment intent creation
// Implemented in Phase 1.5 (free tickets) and Phase 1.6 (Stripe paid tickets)

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', detail: 'Registration endpoint coming in Phase 1.5' },
    { status: 501 }
  );
}
