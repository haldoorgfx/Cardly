import { NextResponse } from 'next/server';
// Phase 1.6 — Stripe PaymentIntent creation for paid tickets

export async function POST() {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', detail: 'Stripe ticket checkout coming in Phase 1.6' },
    { status: 501 }
  );
}
