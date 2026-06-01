import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: events }] = await Promise.all([
    admin.from('profiles').select('email, full_name, plan, role, created_at').eq('id', user.id).single(),
    admin.from('events').select('id, name, slug, status, view_count, download_count, created_at, updated_at').eq('user_id', user.id),
  ]);

  // generated_cards link to events, not directly to the user — fetch full rows for GDPR completeness
  const eventIds = (events ?? []).map(e => e.id);
  let generatedCards: Array<{ id: string; event_id: string; attendee_name: string | null; attendee_data: unknown; output_url: string | null; created_at: string }> = [];
  if (eventIds.length > 0) {
    const { data: cards } = await admin
      .from('generated_cards')
      .select('id, event_id, attendee_name, attendee_data, output_url, created_at')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });
    generatedCards = cards ?? [];
  }

  const exportPayload = {
    exported_at: new Date().toISOString(),
    profile: { id: user.id, ...profile },
    events: events ?? [],
    generated_cards: generatedCards,
  };

  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="karta-data-export.json"',
    },
  });
}
