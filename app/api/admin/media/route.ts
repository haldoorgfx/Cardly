import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { listMedia, insertMedia } from '@/lib/cms/queries';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/media?limit=48&offset=0&search=...
export async function GET(request: Request) {
  const result = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '48', 10), 100);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const search = searchParams.get('search') ?? undefined;

  try {
    const { items, total } = await listMedia({ limit, offset, search });
    return NextResponse.json({ items, total });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Query error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/media — multipart upload
// Body: FormData with `file` field + optional `alt` text field
export async function POST(request: Request) {
  const result = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in result) return result.error;
  const { user } = result;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const blob = file as File;
  const altText = (formData.get('alt') as string | null) ?? '';

  // Validate type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedMimes.includes(blob.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP, GIF and SVG files are allowed' },
      { status: 400 },
    );
  }

  // Max 10 MB
  if (blob.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 });
  }

  const ext = blob.name.split('.').pop() ?? 'bin';
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = await createAdminClient();
  const arrayBuffer = await blob.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('cms-media')
    .upload(storagePath, arrayBuffer, {
      contentType: blob.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from('cms-media').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  try {
    const media = await insertMedia({
      url: publicUrl,
      filename: blob.name,
      alt: altText || undefined,
      sizeBytes: blob.size,
      mime: blob.type,
      uploadedBy: user.id,
    });
    return NextResponse.json({ media }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'DB error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
