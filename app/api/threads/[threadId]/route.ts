import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, { params }: { params: { threadId: string } }) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('messages')
    .select('*')
    .eq('thread_id', params.threadId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

export async function POST(req: NextRequest, { params }: { params: { threadId: string } }) {
  const { sender_id, content } = await req.json();
  if (!sender_id || !content) return NextResponse.json({ error: 'sender_id and content required' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('messages')
    .insert({ thread_id: params.threadId, sender_id, content })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('message_threads').update({ last_message_at: new Date().toISOString() }).eq('id', params.threadId);
  return NextResponse.json({ message: data }, { status: 201 });
}
