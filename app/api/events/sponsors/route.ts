import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { event_id, company_name, tier, booth_location, website_url } = body;
  if (!event_id || !company_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Verify ownership
  const { data: event } = await admin.from('events').select('id').eq('id', event_id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const invite_token = randomUUID();

  const { data: sponsor, error } = await admin
    .from('sponsors')
    .insert({
      event_id,
      company_name,
      tier: tier || 'standard',
      booth_location: booth_location || null,
      website_url: website_url || null,
      invite_token,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sponsor });
}
