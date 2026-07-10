import { NextResponse } from 'next/server';
import { ERA } from '@/lib/ai/era';

// This route is public — no auth required.
// ERA Q&A is available on all public event pages; the organizer's plan
// enables the feature for their event's attendees automatically.
export async function POST(request: Request) {
  const body = await request.json() as {
    question: string;
    event: { name: string; description: string; date: string; venue: string; agenda?: string };
  };
  const { question, event } = body;

  if (!question || !event?.name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const result = await ERA.answerQuestion(question, event);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
