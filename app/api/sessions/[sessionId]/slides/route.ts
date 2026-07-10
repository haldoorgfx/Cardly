import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const admin = createAdminClient();
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `slides/${params.sessionId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from('event-assets')
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('event-assets').getPublicUrl(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from('sessions')
    .update({ slides_url: publicUrl })
    .eq('id', params.sessionId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ url: publicUrl });
}
