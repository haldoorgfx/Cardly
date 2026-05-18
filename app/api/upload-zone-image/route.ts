import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
  'image/gif', 'image/svg+xml',
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  const formData = await req.formData();
  const file    = formData.get('file')    as File   | null;
  const eventId = formData.get('eventId') as string | null;

  if (!file || !eventId) {
    return NextResponse.json({ error: 'Missing file or eventId' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type. Use PNG, JPG, WebP, GIF, or SVG.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }

  const ext      = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  const path     = `${eventId}/zone-images/${Date.now()}-${safeName}`;
  const buf      = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from('event-backgrounds')
    .upload(path, buf, { contentType: file.type, upsert: false, cacheControl: '31536000' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-backgrounds')
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, ext });
}
