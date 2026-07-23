import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateWebhook, deleteWebhook, rotateWebhookSecret } from '@/lib/webhooks';
import { validateWebhookUrl } from '@/lib/webhooks/ssrf';
import { getUserPlan } from '@/lib/billing/can';
import type { WebhookEvent } from '@/lib/webhooks';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

const VALID_EVENTS: WebhookEvent[] = ['card.generated', 'event.published', 'event.viewed'];

// PATCH /api/webhooks/[id] — update url / events / enabled
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Same Studio gate POST enforces. Without it a downgraded account could still
  // re-enable, re-point and re-subscribe its existing webhooks indefinitely.
  if ((await getUserPlan(user.id)) !== 'studio') {
    return NextResponse.json({ error: 'Webhooks require the Studio plan.' }, { status: 402 });
  }

  const body = await req.json();
  const patch: Parameters<typeof updateWebhook>[2] = {};

  if (typeof body.url === 'string') {
    const trimmed = body.url.trim();
    try { new URL(trimmed); } catch {
      return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
    }
    // Same SSRF guard POST uses — without it, a webhook could be created
    // against a benign URL and then repointed at an internal/metadata
    // endpoint via update. fireWebhooks() re-validates at send time too,
    // but this closes the gap at the source instead of relying only on that.
    const urlCheck = await validateWebhookUrl(trimmed);
    if (!urlCheck.ok) {
      return NextResponse.json({ error: urlCheck.reason }, { status: 400 });
    }
    patch.url = trimmed;
  }
  if (Array.isArray(body.events)) {
    const invalid = body.events.filter((e: string) => !VALID_EVENTS.includes(e as WebhookEvent));
    if (invalid.length > 0) return NextResponse.json({ error: `Invalid events: ${invalid.join(', ')}` }, { status: 400 });
    patch.events = body.events as WebhookEvent[];
  }
  if (typeof body.enabled === 'boolean') {
    patch.enabled = body.enabled;
  }

  await updateWebhook(params.id, user.id, patch);
  return NextResponse.json({ ok: true });
}

// POST /api/webhooks/[id] — { action: 'rotate_secret' }
// Issues a fresh signing secret and returns it ONCE. This is the only way to
// obtain a usable secret: the list endpoint deliberately truncates it.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if ((await getUserPlan(user.id)) !== 'studio') {
    return NextResponse.json({ error: 'Webhooks require the Studio plan.' }, { status: 402 });
  }

  const body = await req.json().catch(() => ({}));
  if (body?.action !== 'rotate_secret') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  }

  const secret = await rotateWebhookSecret(params.id, user.id);
  if (!secret) return NextResponse.json({ error: 'Webhook not found.' }, { status: 404 });
  return NextResponse.json({ secret });
}

// DELETE /api/webhooks/[id] — delete a webhook
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteWebhook(params.id, user.id);
  return new NextResponse(null, { status: 204 });
}
