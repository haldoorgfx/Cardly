import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { eventIdForSponsor, sniffImageMime } from '@/lib/auth/event-content';
import { ownedSponsor } from '@/lib/rbac/ownership';
import { canManageEvent } from '@/lib/rbac/canManageEvent';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const file = formData.get('file') as File | null;
  const sponsorId = formData.get('sponsorId') as string | null;
  const token = formData.get('token') as string | null;
  if (!file || !sponsorId) return NextResponse.json({ error: 'Missing file or sponsorId' }, { status: 400 });

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  const eventId = await eventIdForSponsor(sponsorId);
  if (!eventId) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });

  // Authorize one of three ways:
  //  1. a valid invite token for THIS sponsor (the exhibitor Booth tab, both the
  //     account-less /exhibitor/[token] portal and its logged-in twin at
  //     /sponsoring/[sponsorId] pass their own token through here rather than
  //     the broken direct-to-storage upload this route replaces), or
  //  2. the logged-in owner of this specific sponsor record, or
  //  3. the event's organizer/team (the existing behaviour for the organizer's
  //     Sponsors management page, which sets logos on sponsors it hasn't
  //     handed a token to yet).
  //
  // Deliberately NOT the broader authorizeEventContent() "any contributor"
  // check other content routes use — that treats speaker/staff/sponsor roles
  // on the event as interchangeable, which here would let one sponsor at an
  // event overwrite a DIFFERENT sponsor's public logo (same event, unrelated
  // booth) since authorizeEventContent only checks "does this user hold any
  // contributor role for this event", never "for this sponsor". Only the
  // sponsor's own owner or the actual event organizer may set this sponsor's
  // logo.
  let allowed = false;
  let loggedIn = false;
  if (token) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data: byToken } = await admin
      .from('sponsors')
      .select('id')
      .eq('id', sponsorId)
      .eq('invite_token', token)
      .maybeSingle();
    allowed = Boolean(byToken);
  }
  if (!allowed) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    loggedIn = Boolean(user);
    if (user) {
      allowed = Boolean(await ownedSponsor(user.id, sponsorId)) || (await canManageEvent(user.id, eventId));
    }
  }
  if (!allowed) {
    return NextResponse.json({ error: loggedIn ? 'Forbidden' : 'Unauthorized' }, { status: loggedIn ? 403 : 401 });
  }

  // Validate the actual bytes (magic number), not the client-declared type —
  // otherwise an HTML/SVG payload could be served from a public bucket (stored XSS).
  const bytes = await file.arrayBuffer();
  const mime = sniffImageMime(bytes);
  if (!mime) return NextResponse.json({ error: 'File must be a JPEG, PNG, WebP, or GIF image' }, { status: 400 });

  const path = `sponsor-logos/${sponsorId}.${EXT[mime]}`;
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, bytes, { contentType: mime, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('event-assets').getPublicUrl(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('sponsors')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', sponsorId);

  return NextResponse.json({ url: publicUrl });
}
