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

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 });
  }

  // Ownership: the caller must be the event owner, the sponsor's own account,
  // or present the sponsor's invite token.
  if (!(await canManageSponsor(sponsorId, token))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const rawExt = (file.name.split('.').pop() ?? 'bin').toLowerCase();
  // Block script/executable extensions from the public bucket.
  const ext = /^(exe|sh|bat|cmd|js|mjs|php|py|rb|jar|html?|svg)$/.test(rawExt) ? 'bin' : rawExt.replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin';
  const ts = Date.now();
  const path = `sponsor-resources/${sponsorId}/${ts}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('event-assets').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
