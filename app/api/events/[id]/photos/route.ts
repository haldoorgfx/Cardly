import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
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
