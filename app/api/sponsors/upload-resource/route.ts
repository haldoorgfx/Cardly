import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { authorizeEventContent, eventIdForSponsor } from '@/lib/auth/event-content';

// Resources can be non-image docs (PDF/PPTX/etc.), so we don't sniff for an
// image type — but we DO require the event's organizer/contributor, cap the
// size, and store with a neutral content type so nothing is served as active
// HTML from the public bucket.
export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const file = formData.get('file') as File | null;
  const sponsorId = formData.get('sponsorId') as string | null;
  if (!file || !sponsorId) return NextResponse.json({ error: 'Missing file or sponsorId' }, { status: 400 });

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 });
  }

  const eventId = await eventIdForSponsor(sponsorId);
  if (!eventId) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
  const auth = await authorizeEventContent(eventId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rawExt = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = rawExt.slice(0, 5) || 'bin';
  const ts = Date.now();
  const path = `sponsor-resources/${sponsorId}/${ts}.${ext}`;
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, await file.arrayBuffer(), {
      // Force a download-y content type so an uploaded .html/.svg can't execute
      // in a victim's browser from our origin.
      contentType: 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('event-assets').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
