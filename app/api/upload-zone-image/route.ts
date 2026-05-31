import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
  const ext = file.name.split('.').pop() ?? 'png';
  const folder = eventId ? `${user.id}/${eventId}` : `${user.id}/assets`;
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-backgrounds')
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
