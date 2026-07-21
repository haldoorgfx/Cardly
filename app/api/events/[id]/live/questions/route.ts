import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('qa_questions')
    .select('id, question, upvotes_count, is_anonymous, status, registrations!qa_questions_registration_id_fkey(attendee_name)')
    .eq('event_id', id)
    .neq('status', 'hidden')
    .order('upvotes_count', { ascending: false })
    .limit(6);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (data ?? []).map((q: any) => ({
    id: q.id,
    question: q.question,
    votes: q.upvotes_count,
    asker_name: q.is_anonymous ? null : (q.registrations?.attendee_name ?? null),
  }));

  return NextResponse.json(questions);
}
