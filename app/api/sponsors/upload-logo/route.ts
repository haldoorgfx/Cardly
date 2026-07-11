import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { canManageSponsor } from '@/lib/sponsors/authorize';

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const file = formData.get('file') as File | null;
  const sponsorId = formData.get('sponsorId') as string | null;
  const token = formData.get('token') as string | null;
  if (!file || !sponsorId) return NextResponse.json({ error: 'Missing file or sponsorId' }, { status: 400 });

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  // Ownership: the caller must be the event owner, the sponsor's own account,
  // or present the sponsor's invite token.
  if (!(await canManageSponsor(sponsorId, token))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const rawExt = (file.name.split('.').pop() ?? 'png').toLowerCase();
  const ext = /^(png|jpe?g|webp|gif|svg)$/.test(rawExt) ? rawExt : 'png';
  const path = `sponsor-logos/${sponsorId}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('event-assets').getPublicUrl(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('sponsors')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', sponsorId);

  return NextResponse.json({ url: publicUrl });
}
