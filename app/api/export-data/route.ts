import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: events }, { data: cards }] = await Promise.all([
    admin.from('profiles').select('email, full_name, plan, role, created_at').eq('id', user.id).single(),
    admin.from('events').select('name, slug, status, view_count, download_count, created_at, updated_at').eq('user_id', user.id),
    admin.from('generated_cards').select('attendee_name, created_at').eq('event_id', user.id),
  ]);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    profile: { id: user.id, ...profile },
    events: events ?? [],
    generated_cards_count: cards?.length ?? 0,
  };

  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="cardly-data-export.json"',
    },
  });
}
