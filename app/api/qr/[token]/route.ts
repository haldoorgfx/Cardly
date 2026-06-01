import { NextRequest, NextResponse } from 'next/server';
import { generateQRBuffer } from '@/lib/qr/generate';
import { createAdminClient } from '@/lib/supabase/server';

// Serves the QR code image for a given registration token
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: reg } = await admin
    .from('registrations')
    .select('event_id, events!event_id(slug)')
    .eq('qr_code_token', params.token)
    .single();

  if (!reg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const event = reg.events as { slug: string } | null;
  const slug = event?.slug ?? reg.event_id;

  const buffer = await generateQRBuffer({ token: params.token, eventSlug: slug, size: 300 });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
