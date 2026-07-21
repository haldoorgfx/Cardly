import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ownedSpeaker } from '@/lib/rbac/ownership';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { sniffImageMime } from '@/lib/auth/event-content';

/**
 * Speaker headshot upload.
 *
 * WHY THIS ROUTE EXISTS: the speaker workspace used to upload straight from the
 * browser with the anon key, to `avatars/speakers/<speakerId>/headshot.<ext>`.
 * Two things were wrong with that:
 *
 *  1. No migration in this repo creates an `avatars` bucket. Migration 050
 *     creates exactly two — `uploads` and `event-assets` — and every other
 *     client upload on the platform targets `uploads`. If the bucket is indeed
 *     absent in prod, every headshot upload failed with "Bucket not found",
 *     was swallowed by the client's catch, and the preview silently reverted:
 *     "Change headshot" would never have worked. (Migrations 051-104 are not
 *     in this repo, so this could not be proven from disk; the public read
 *     endpoint answers "Object not found" for a missing bucket too.)
 *  2. Had the bucket existed, the path was keyed on the SPEAKER id, not the
 *     caller's user id, so any signed-in account could overwrite any speaker's
 *     headshot by guessing a public id. Migration 110 now confines the
 *     `uploads` bucket to `avatars/<own-uid>...` and gives `event-assets` no
 *     client write policy at all, so a client-side write cannot be made safe
 *     here — it has to go through the service role, behind an ownership check.
 *
 * Same shape as /api/sponsors/upload-logo: authorize, sniff the real bytes,
 * write with the service role, persist the public URL.
 */

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(
  req: Request,
  { params }: { params: { speakerId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Identical gate to PATCH /api/speakers/[speakerId]/profile — the speaker
  // themself, or the event's organizer/team.
  let allowed = Boolean(await ownedSpeaker(user.id, params.speakerId));
  if (!allowed) {
    const { data: speakerRow } = await adminAny
      .from('speakers')
      .select('event_id')
      .eq('id', params.speakerId)
      .maybeSingle();
    if (!speakerRow) return NextResponse.json({ error: 'Speaker not found' }, { status: 404 });
    const { data: event } = await adminAny
      .from('events')
      .select('id')
      .eq('id', speakerRow.event_id)
      .in('user_id', await manageableOwnerIds(user.id))
      .maybeSingle();
    allowed = Boolean(event);
  }
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  // Validate the actual bytes, never the client-declared type — otherwise an
  // HTML/SVG payload would be served from a public bucket on our own origin.
  const bytes = await file.arrayBuffer();
  const mime = sniffImageMime(bytes);
  if (!mime) {
    return NextResponse.json({ error: 'File must be a JPEG, PNG, WebP, or GIF image' }, { status: 400 });
  }

  const path = `speaker-headshots/${params.speakerId}.${EXT[mime]}`;
  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, bytes, { contentType: mime, upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // Cache-bust: the path is deterministic, so a replacement would otherwise
  // keep serving the old image from the CDN.
  const { data: { publicUrl } } = admin.storage.from('event-assets').getPublicUrl(path);
  const url = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await adminAny
    .from('speakers')
    .update({ photo_url: url })
    .eq('id', params.speakerId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ url });
}
