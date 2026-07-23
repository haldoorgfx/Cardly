import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

type Params = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB — matches /api/upload's cap

// POST /api/events/[id]/photos — public attendee submission to the photo wall.
// event_photos (migration 037) has no registration_id column, so identity here
// is the same trust level as the CFP form: a typed name, not a verified
// registration. Every submission lands as 'pending' — migration 101's RLS
// only ever exposes 'approved'/'featured' rows publicly, so nothing this
// route inserts is visible to anyone until an organizer moderates it in.
export async function POST(req: Request, { params }: Params) {
  if (!(await isPlatformFeatureEnabled('photos'))) return NextResponse.json({ error: 'The photo wall is currently unavailable.' }, { status: 404 });

  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: event }, features] = await Promise.all([
    admin.from('events').select('id').eq('id', id).maybeSingle(),
    getEventFeatures(id),
  ]);
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (!isSectionEnabled(features, 'photos')) {
    return NextResponse.json({ error: 'The photo wall is not open for this event' }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A photo is required' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Photo is too large. Maximum size is 10 MB' }, { status: 400 });
  }

  const attendeeName = (formData.get('attendee_name') as string | null)?.trim().slice(0, 200) || null;
  const caption      = (formData.get('caption') as string | null)?.trim().slice(0, 500) || null;
  const dayLabel     = (formData.get('day_label') as string | null)?.trim().slice(0, 60) || null;

  // Best-effort attribution — attaches the account when the uploader happens
  // to be signed in. Guests (the common case at a live event) upload with
  // just the name they type, same as every other public attendee form here.
  let uploaderId: string | null = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    uploaderId = user?.id ?? null;
  } catch { /* guest */ }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `photo-wall/${id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-assets').getPublicUrl(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('event_photos')
    .insert({
      event_id: id,
      uploader_id: uploaderId,
      attendee_name: attendeeName,
      image_url: urlData.publicUrl,
      caption,
      day_label: dayLabel,
      status: 'pending',
    })
    .select('id, status')
    .single();

  if (error) {
    // The storage write already landed — don't leave an orphaned file behind
    // when the DB insert that was supposed to reference it fails.
    await admin.storage.from('event-assets').remove([path]).catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ photo: data }, { status: 201 });
}

export async function PATCH(req: Request, { params }: Params) {
  if (!(await isPlatformFeatureEnabled('photos'))) return NextResponse.json({ error: 'The photo wall is currently unavailable.' }, { status: 404 });

  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { photoId, status } = await req.json() as { photoId: string; status: string };
  const allowed = ['pending', 'approved', 'rejected', 'featured'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('event_photos')
    .update({ status })
    .eq('id', photoId)
    .eq('event_id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
