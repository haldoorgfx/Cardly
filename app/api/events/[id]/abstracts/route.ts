import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify event ownership
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as {
    abstractId: string;
    status?: string;
    review_notes?: string;
    assigned_session?: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: abstract, error } = await (admin as any)
    .from('abstracts')
    .update({
      ...(body.status && { status: body.status }),
      ...(body.review_notes !== undefined && { review_notes: body.review_notes }),
      ...(body.assigned_session !== undefined && {
        assigned_session: body.assigned_session || null,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.abstractId)
    .eq('event_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ abstract });
}
