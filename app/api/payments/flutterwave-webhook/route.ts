import { NextRequest, NextResponse } from 'next/server';
// Phase 1.7 — Flutterwave webhook: charge.completed → mark registration paid

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', detail: 'Flutterwave webhook coming in Phase 1.7' },
    { status: 501 }
  );
}
