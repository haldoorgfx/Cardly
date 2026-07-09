import { NextResponse } from 'next/server';

// Phase 1.6/1.7 — Stripe + Flutterwave payment webhook handler
export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
