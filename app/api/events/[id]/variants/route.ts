import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify the event belongs to the user
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await admin
    .from('event_variants')
    .select('*')
    .eq('event_id', id)
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify the event belongs to the user
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await req.formData();
  const variantName = (formData.get('variant_name') as string | null)?.trim();
  const file = formData.get('file') as File | null;

  if (!variantName) return NextResponse.json({ error: 'variant_name is required' }, { status: 400 });
  if (!file) return NextResponse.json({ error: 'background file is required' }, { status: 400 });

  // Generate a slug from the variant name
  const variantSlug = variantName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);

  // Upload background
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${user.id}/${id}-${variantSlug}-${Date.now()}.${ext}`;

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
  // Parse image dimensions — proper JPEG APPn-skipping parser
  if (file.type === 'image/jpeg') {
    let i = 2; // skip SOI (FF D8)
    while (i < uint8.length - 8) {
      if (uint8[i] !== 0xFF) break;
      const marker = uint8[i + 1];
      // SOF markers: C0-C3, C5-C7, C9-CB, CD-CF
      if ((marker >= 0xC0 && marker <= 0xC3) ||
          (marker >= 0xC5 && marker <= 0xC7) ||
          (marker >= 0xC9 && marker <= 0xCB) ||
          (marker >= 0xCD && marker <= 0xCF)) {
        h = (uint8[i + 5] << 8) | uint8[i + 6];
        w = (uint8[i + 7] << 8) | uint8[i + 8];
        break;
      }
      // Skip this marker's data: length is at i+2, i+3
      const len = (uint8[i + 2] << 8) | uint8[i + 3];
      i += 2 + len;
    }
  } else if (file.type === 'image/png') {
    if (uint8.length > 24) {
      w = (uint8[16] << 24) | (uint8[17] << 16) | (uint8[18] << 8) | uint8[19];
      h = (uint8[20] << 24) | (uint8[21] << 16) | (uint8[22] << 8) | uint8[23];
    }
  }

  // Find the current max position
  const { data: existingVariants } = await admin
    .from('event_variants')
    .select('position')
    .eq('event_id', id)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = (existingVariants?.[0]?.position ?? -1) + 1;

  const { data: variant, error: dbError } = await admin
    .from('event_variants')
    .insert({
      event_id: id,
      variant_name: variantName,
      variant_slug: variantSlug,
      background_url: backgroundUrl,
      background_width: w || null,
      background_height: h || null,
      zones: [],
      position: nextPosition,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(variant);
}
