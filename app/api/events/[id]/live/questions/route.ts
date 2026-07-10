import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('qa_questions')
    .select('id, question, votes, asker_name, asker_affiliation, is_answered')
    .eq('event_id', id)
    .eq('is_hidden', false)
    .order('votes', { ascending: false })
    .limit(6);

  return NextResponse.json(data ?? []);
}
