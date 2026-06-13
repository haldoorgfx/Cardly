import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const ALLOWED = ['checkout_collect_details', 'checkout_require_approval', 'checkout_show_remaining', 'checkout_apply_vat'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body && typeof body[key] === 'boolean') patch[key] = body[key];
  }
  // fee_bearer is an enum, not a boolean — who pays the platform fee.
  if (body.fee_bearer === 'absorb' || body.fee_bearer === 'pass') patch.fee_bearer = body.fee_bearer;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('events').update(patch).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
