import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  PROVIDERS,
  validateConfig,
  upsertIntegration,
  deleteIntegration,
  type IntegrationProvider,
  type IntegrationConfig,
} from '@/lib/integrations';

function parseProvider(raw: string): IntegrationProvider | null {
  return (PROVIDERS as string[]).includes(raw) ? (raw as IntegrationProvider) : null;
}

// PUT /api/integrations/[provider] — connect or update. Body: provider config.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider: raw } = await params;
  const provider = parseProvider(raw);
  if (!provider) return NextResponse.json({ error: 'Unknown integration.' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as IntegrationConfig & { enabled?: boolean };
  const result = validateConfig(provider, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const enabled = body.enabled !== false;
  await upsertIntegration(user.id, provider, result.config, enabled);
  return NextResponse.json({ ok: true });
}

// DELETE /api/integrations/[provider] — disconnect.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider: raw } = await params;
  const provider = parseProvider(raw);
  if (!provider) return NextResponse.json({ error: 'Unknown integration.' }, { status: 404 });

  await deleteIntegration(user.id, provider);
  return NextResponse.json({ ok: true });
}
