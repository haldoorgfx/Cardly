import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sniffImageMime } from '@/lib/auth/event-content';
import sharp from 'sharp';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const eventId = formData.get('eventId') as string | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 20 MB' }, { status: 400 });
  }

  // Validate the actual bytes (magic number), not the client-declared type —
  // file.type is attacker-controlled, so an SVG/HTML payload could previously
  // claim image/gif and be stored (and served) with that content type from a
  // public bucket. SVG is excluded on purpose: scripts inside it execute when
  // served inline from a public CDN origin.
  const bytes = await file.arrayBuffer();
  const mime = sniffImageMime(bytes);
  if (!mime) {
    return NextResponse.json({ error: 'File must be a JPEG, PNG, WebP, or GIF image' }, { status: 400 });
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
      .in('user_id', await manageableOwnerIds(user.id))
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ error: 'Event not found or not owned by you' }, { status: 403 });
    }
  }

  const folder = eventId ? `${user.id}/${eventId}` : `${user.id}/assets`;

  // Normalize EXIF orientation so the image displays correctly in the canvas
  // and in the renderer. GIF passes through unchanged (sharp doesn't rotate GIFs).
  let uploadBytes: Buffer;
  let uploadMime: string = mime;
  if (mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp') {
    uploadBytes = await sharp(Buffer.from(bytes)).rotate().toBuffer();
  } else {
    uploadBytes = Buffer.from(bytes);
  }

  // Always store as PNG after EXIF normalization (ensures consistent format)
  const ext = mime === 'image/gif' ? 'gif' : 'png';
  if (mime !== 'image/gif') uploadMime = 'image/png';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-backgrounds')
    .upload(path, uploadBytes, { contentType: uploadMime, upsert: false, cacheControl: '31536000' });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
