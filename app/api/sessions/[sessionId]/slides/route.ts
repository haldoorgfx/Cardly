import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { authorizeEventContent, eventIdForSession } from '@/lib/auth/event-content';

export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 25 MB)' }, { status: 400 });
  }

  // Authorize: only the event's organizer/speaker/contributors may set slides.
  const eventId = await eventIdForSession(params.sessionId);
  if (!eventId) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  const auth = await authorizeEventContent(eventId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const rawExt = (file.name.split('.').pop() ?? 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ext = rawExt.slice(0, 5) || 'pdf';
  const path = `slides/${params.sessionId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, await file.arrayBuffer(), {
      // Neutral content type so an uploaded .html/.svg can't execute from our origin.
      contentType: 'application/octet-stream',
      upsert: true,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('event-assets').getPublicUrl(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from('sessions')
    .update({ slides_url: publicUrl })
    .eq('id', params.sessionId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ url: publicUrl });
}
