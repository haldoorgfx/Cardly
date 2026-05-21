import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { updateMediaAlt, deleteMedia } from '@/lib/cms/queries';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';

// PATCH /api/admin/media/[id] — update alt text
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const result = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { alt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.alt !== 'string') {
    return NextResponse.json({ error: 'alt must be a string' }, { status: 400 });
  }

  try {
    const media = await updateMediaAlt(params.id, body.alt);
    await logAudit(user, 'cms.media_alt_updated', 'media', params.id, {
      after: { alt: body.alt },
    });
    return NextResponse.json({ media });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Update error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/media/[id]
// Removes the DB record and the Storage object.
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const result = await getAuthorizedUser(CONTENT_EDIT);
  if ('error' in result) return result.error;
  const { user } = result;

  // Fetch the record so we can delete from Storage too
  const supabase = await createAdminClient();
  const { data: media, error: fetchError } = await supabase
    .from('cms_media')
    .select('url, filename')
    .eq('id', params.id)
    .single();

  if (fetchError || !media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }

  // Extract storage path from URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/cms-media/<path>
  const urlObj = new URL(media.url);
  const storagePrefix = '/storage/v1/object/public/cms-media/';
  const storagePath = urlObj.pathname.startsWith(storagePrefix)
    ? urlObj.pathname.slice(storagePrefix.length)
    : null;

  if (storagePath) {
    // Best-effort storage deletion — don't block on error
    await supabase.storage.from('cms-media').remove([storagePath]);
  }

  try {
    await deleteMedia(params.id);
    await logAudit(user, 'cms.media_deleted', 'media', params.id, {
      before: { url: media.url, filename: media.filename },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Delete error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
