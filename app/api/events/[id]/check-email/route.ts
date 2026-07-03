import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Lightweight duplicate-registration check. Called before the attendee reaches
// the final submit step so guests see "already registered" at step 1, not step 3.
// No auth required — email is the only identifier for guests.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ registered: false });

  const admin = createAdminClient();
  const { data } = await admin
    .from('registrations')
    .select('id, qr_code_token')
    .eq('event_id', params.id)
    .eq('attendee_email', email)
    .in('status', ['confirmed', 'checked_in'])
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    registered: !!data,
    token: (data as { qr_code_token?: string } | null)?.qr_code_token ?? null,
  });
}
