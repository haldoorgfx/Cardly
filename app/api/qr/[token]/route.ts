import { NextRequest, NextResponse } from 'next/server';
import { generateQRBuffer } from '@/lib/qr/generate';
import { createAdminClient } from '@/lib/supabase/server';

// Serves the QR code image for a given registration token
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: reg } = await admin
    .from('registrations')
    .select('event_id, events!inner(slug)')
    .eq('qr_code_token', params.token)
    .single();

  if (!reg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const event = reg.events as { slug: string } | null;
  const slug = event?.slug ?? reg.event_id;

  const buffer = await generateQRBuffer({ token: params.token, eventSlug: slug, size: 300 });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      // The URL itself contains the ticket's bearer token, so this image must
      // not be held in a shared cache: a transferred ticket rotates the token
      // and this route then 404s, which is the whole point of the rotation.
      // 'private' keeps it in the holder's own browser only.
      'Cache-Control': 'private, max-age=86400',
    },
  });
}
