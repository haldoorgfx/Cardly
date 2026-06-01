import { NextRequest, NextResponse } from 'next/server';
// Phase 1.9 — validate promo code and return discount amount

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', detail: 'Promo code validation coming in Phase 1.9' },
    { status: 501 }
  );
}
