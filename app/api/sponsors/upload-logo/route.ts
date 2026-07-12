import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  authorizeEventContent,
  eventIdForSponsor,
  sniffImageMime,
} from '@/lib/auth/event-content';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const file = formData.get('file') as File | null;
  const sponsorId = formData.get('sponsorId') as string | null;
  if (!file || !sponsorId) return NextResponse.json({ error: 'Missing file or sponsorId' }, { status: 400 });

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  // Authorize: only the event's organizer/contributors may set a sponsor logo.
  const eventId = await eventIdForSponsor(sponsorId);
  if (!eventId) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
  const auth = await authorizeEventContent(eventId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Validate the actual bytes (magic number), not the client-declared type —
  // otherwise an HTML/SVG payload could be served from a public bucket (stored XSS).
  const bytes = await file.arrayBuffer();
  const mime = sniffImageMime(bytes);
  if (!mime) return NextResponse.json({ error: 'File must be a JPEG, PNG, WebP, or GIF image' }, { status: 400 });

  const path = `sponsor-logos/${sponsorId}.${EXT[mime]}`;
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, bytes, { contentType: mime, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('event-assets').getPublicUrl(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('sponsors')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', sponsorId);

  return NextResponse.json({ url: publicUrl });
}
