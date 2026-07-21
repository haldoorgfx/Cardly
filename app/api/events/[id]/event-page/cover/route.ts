import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sniffImageMime } from '@/lib/auth/event-content';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large — maximum 10 MB' }, { status: 400 });
  }

  // Sniff the real bytes rather than trusting file.type, which the client sets
  // freely — otherwise arbitrary content lands in a public bucket labelled as
  // an image. GIF is rejected here on purpose: covers are stills.
  const bytes = await file.arrayBuffer();
  const mime = sniffImageMime(bytes);
  if (!mime || mime === 'image/gif') {
    return NextResponse.json({ error: 'Only PNG, JPG, or WebP are supported' }, { status: 400 });
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `covers/${user.id}/${params.id}-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-backgrounds')
    .upload(path, bytes, { contentType: mime, upsert: false, cacheControl: '31536000' });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(path);
  return NextResponse.json({ cover_image_url: urlData.publicUrl });
}
