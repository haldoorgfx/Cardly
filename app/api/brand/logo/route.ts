import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sniffImageMime } from '@/lib/auth/event-content';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const variant = formData.get('variant') as string | null; // 'light' | 'dark' | 'transparent'

  if (!file || !variant) {
    return NextResponse.json({ error: 'Missing file or variant' }, { status: 400 });
  }

  if (!['light', 'dark', 'transparent'].includes(variant)) {
    return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 });
  }

  // Validate the bytes, not the declared type — a logo URL is rendered on
  // public event pages, so anything stored here is served from our origin.
  const bytes = await file.arrayBuffer();
  const mime = sniffImageMime(bytes);
  if (!mime || mime === 'image/gif') {
    return NextResponse.json({ error: 'Only PNG, JPG, and WebP are supported' }, { status: 400 });
  }

  const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
  const path = `brand/${user.id}/logo-${variant}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from('event-backgrounds')
    .upload(path, bytes, { contentType: mime, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('event-backgrounds').getPublicUrl(path);

  // Persist URL into brand_kit
  const { data: existing } = await admin
    .from('profiles')
    .select('brand_kit')
    .eq('id', user.id)
    .single();

  const brandKit = (existing?.brand_kit ?? {}) as Record<string, unknown>;
  const logos = ((brandKit.logos ?? {}) as Record<string, string>);
  logos[variant] = publicUrl;

  await admin.from('profiles').update({ brand_kit: { ...brandKit, logos } }).eq('id', user.id);

  return NextResponse.json({ ok: true, url: publicUrl });
}
