import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { canCreateEvent } from '@/lib/billing/can';

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  // Auth check with user client
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin client for trusted DB writes (bypasses RLS after we've verified auth above)
  const admin = createAdminClient();

  // Check plan limits
  const allowed = await canCreateEvent(user.id);
  if (!allowed) {
    return NextResponse.json({ error: 'PLAN_LIMIT' }, { status: 402 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const name = (formData.get('name') as string | null) ?? 'Untitled Event';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${user.id}/${Date.now()}.${ext}`;

  // Storage upload uses admin client (bypasses storage RLS)
  const { error: uploadError } = await admin.storage
    .from('event-backgrounds')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from('event-backgrounds').getPublicUrl(path);
  const backgroundUrl = urlData.publicUrl;

  // Parse image dimensions
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let w = 0, h = 0;
  if (file.type === 'image/jpeg') {
    // Proper JPEG parser — skip each marker's APPn data segment by its length
    let i = 2; // skip SOI (FF D8)
    while (i < uint8.length - 8) {
      if (uint8[i] !== 0xFF) break;
      const marker = uint8[i + 1];
      // SOF markers carry the dimensions: C0-C3, C5-C7, C9-CB, CD-CF
      if ((marker >= 0xC0 && marker <= 0xC3) ||
          (marker >= 0xC5 && marker <= 0xC7) ||
          (marker >= 0xC9 && marker <= 0xCB) ||
          (marker >= 0xCD && marker <= 0xCF)) {
        h = (uint8[i + 5] << 8) | uint8[i + 6];
        w = (uint8[i + 7] << 8) | uint8[i + 8];
        break;
      }
      const len = (uint8[i + 2] << 8) | uint8[i + 3];
      i += 2 + len;
    }
  } else if (file.type === 'image/png') {
    if (uint8.length > 24) {
      w = (uint8[16] << 24) | (uint8[17] << 16) | (uint8[18] << 8) | uint8[19];
      h = (uint8[20] << 24) | (uint8[21] << 16) | (uint8[22] << 8) | uint8[23];
    }
  }

  const slug = generateSlug(name);
  const { data: event, error: dbError } = await admin
    .from('events')
    .insert({
      user_id: user.id,
      name,
      slug,
      background_url: backgroundUrl,
      background_width: w || null,
      background_height: h || null,
      zones: [],
      status: 'draft',
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Create the default variant (required — attendee page and canvas editor both expect at least one)
  const { error: variantError } = await admin
    .from('event_variants')
    .insert({
      event_id: event.id,
      variant_name: 'Default',
      variant_slug: 'default',
      background_url: backgroundUrl,
      background_width: w || null,
      background_height: h || null,
      zones: [],
      position: 0,
    });

  if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 });

  return NextResponse.json({ id: event.id, slug: event.slug });
}
