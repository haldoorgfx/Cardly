import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const eventId = formData.get('eventId') as string | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // SVG excluded — scripts inside SVG execute when served inline from a public CDN origin
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 20 MB' }, { status: 400 });
  }

  const admin = createAdminClient();

  // eventId comes from the form — verify the caller actually owns that event
  // before using it in the storage path. (Path is user-id-prefixed, but the
  // eventId is still untrusted input.)
  if (eventId) {
    const { data: owned } = await admin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ error: 'Event not found or not owned by you' }, { status: 403 });
    }
  }

  const folder = eventId ? `${user.id}/${eventId}` : `${user.id}/assets`;

  // Normalize EXIF orientation so the image displays correctly in the canvas
  // and in the renderer. GIF passes through unchanged (sharp doesn't rotate GIFs).
  let uploadBytes: Buffer;
  let uploadMime = file.type;
  if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp') {
    uploadBytes = await sharp(Buffer.from(await file.arrayBuffer())).rotate().toBuffer();
  } else {
    uploadBytes = Buffer.from(await file.arrayBuffer());
  }

  // Always store as PNG after EXIF normalization (ensures consistent format)
  const ext = file.type === 'image/gif' ? 'gif' : 'png';
  if (file.type !== 'image/gif') uploadMime = 'image/png';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-backgrounds')
    .upload(path, uploadBytes, { contentType: uploadMime, upsert: false, cacheControl: '31536000' });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
