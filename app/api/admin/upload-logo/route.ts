import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { THEME_EDIT } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET = 'brand-assets';

// POST /api/admin/upload-logo — upload logo to storage, return public URL
export async function POST(request: Request) {
  const result = await getAuthorizedUser(THEME_EDIT);
  if ('error' in result) return result.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, or WebP files allowed' }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 2 MB' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Create bucket if it doesn't exist
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error: createErr } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    });
    if (createErr) {
      return NextResponse.json({ error: `Could not create bucket: ${createErr.message}` }, { status: 500 });
    }
  }

  // Derive extension from MIME type
  const variant = (formData.get('variant') as string | null) ?? 'color';
  const extMap: Record<string, string> = {
    'image/png':  'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  const ext = extMap[file.type] ?? 'png';
  // variant='color' → logo.png  (colored, for light backgrounds)
  // variant='light' → logo-light.png  (white, for dark backgrounds)
  const path = variant === 'light' ? `logo-light.${ext}` : `logo.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { upsert: true, contentType: file.type });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);
  const bustedUrl = `${publicUrl}?t=${Date.now()}`;

  return NextResponse.json({ url: bustedUrl });
}
