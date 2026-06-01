import { NextRequest, NextResponse } from 'next/server';
// Phase 1.8 — QR scan verification + mark checked_in_at

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(
    { error: 'NOT_IMPLEMENTED', detail: 'Check-in endpoint coming in Phase 1.8' },
    { status: 501 }
  );
}
