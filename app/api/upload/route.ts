import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Public upload endpoint for attendee-facing flows (e.g. application-form file
// questions, where the applicant is anonymous and can't use the auth-gated
// upload routes). Files are scoped to a real event and stored inert (neutral
// content type) so an uploaded .html/.svg can't execute from our origin.
//
// Request:  multipart/form-data { file: File, eventId: string }
// Response: { url: string }
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const file = formData.get('file') as File | null;
  const eventId = formData.get('eventId') as string | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 });
  }

  const admin = createAdminClient();

  // The event must exist — this ties the anonymous upload to a real event and
  // keeps the storage path bounded to known event ids.
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const rawExt = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = rawExt.slice(0, 5) || 'bin';
  const path = `application-files/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

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
