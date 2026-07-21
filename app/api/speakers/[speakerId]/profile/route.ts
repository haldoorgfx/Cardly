import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ownedSpeaker } from '@/lib/rbac/ownership';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

export async function PATCH(
  req: Request,
  { params }: { params: { speakerId: string } }
) {
  // AuthZ: only the speaker themself (email/role match) or the event's
  // organizer may edit a speaker profile. This route was previously open.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  let allowed = Boolean(await ownedSpeaker(user.id, params.speakerId));
  if (!allowed) {
    // Event organizer fallback
    const { data: speakerRow } = await adminAny
      .from('speakers')
      .select('event_id')
      .eq('id', params.speakerId)
      .maybeSingle();
    if (speakerRow?.event_id) {
      const { data: event } = await adminAny
        .from('events')
        .select('id')
        .eq('id', speakerRow.event_id)
        .in('user_id', await manageableOwnerIds(user.id))
        .maybeSingle();
      allowed = Boolean(event);
    }
  }
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();

  // Only overwrite photo_url when the client actually sends one — an omitted
  // field must not wipe an existing headshot.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    name: body.name,
    role: body.role || null,
    company: body.company || null,
    bio: body.bio || null,
    twitter_url: body.twitter_url || null,
    linkedin_url: body.linkedin_url || null,
    website_url: body.website_url || null,
  };
  if (body.photo_url !== undefined) updates.photo_url = body.photo_url || null;

  const { error } = await adminAny
    .from('speakers')
    .update(updates)
    .eq('id', params.speakerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
