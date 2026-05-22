import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listWebhooks, createWebhook } from '@/lib/webhooks';
import type { WebhookEvent } from '@/lib/webhooks';

const VALID_EVENTS: WebhookEvent[] = ['card.generated', 'event.published', 'event.viewed'];

// GET /api/webhooks — list user's webhooks
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hooks = await listWebhooks(user.id);
  // Never expose secrets in the list
  return NextResponse.json(hooks.map(h => ({ ...h, secret: h.secret.slice(0, 8) + '…' })));
}

// POST /api/webhooks — create a webhook
// Body: { url: string; events: WebhookEvent[] }
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, events } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: 'url is required.' }, { status: 400 });
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'At least one event is required.' }, { status: 400 });
  }
  const invalid = events.filter((e: string) => !VALID_EVENTS.includes(e as WebhookEvent));
  if (invalid.length > 0) {
    return NextResponse.json({ error: `Invalid events: ${invalid.join(', ')}` }, { status: 400 });
  }

  try { new URL(url.trim()); } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
  }

  // Cap at 5 webhooks per user
  const existing = await listWebhooks(user.id);
  if (existing.length >= 5) {
    return NextResponse.json({ error: 'Maximum 5 webhooks per account.' }, { status: 429 });
  }

  const hook = await createWebhook(user.id, url.trim(), events as WebhookEvent[]);
  return NextResponse.json(hook, { status: 201 });
}
