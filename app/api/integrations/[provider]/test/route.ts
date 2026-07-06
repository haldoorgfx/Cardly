import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PROVIDERS, getIntegration, recordResult, type IntegrationProvider } from '@/lib/integrations';
import { sendToProvider, samplePayload } from '@/lib/integrations/providers';

// POST /api/integrations/[provider]/test — send a sample registration so the
// user can confirm the connection works from their own tool immediately.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider: raw } = await params;
  if (!(PROVIDERS as string[]).includes(raw)) {
    return NextResponse.json({ error: 'Unknown integration.' }, { status: 404 });
  }
  const provider = raw as IntegrationProvider;

  const integration = await getIntegration(user.id, provider);
  if (!integration) return NextResponse.json({ error: 'Not connected.' }, { status: 400 });

  try {
    await sendToProvider(provider, integration.config, samplePayload());
    await recordResult(user.id, provider, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Test failed';
    await recordResult(user.id, provider, msg).catch(() => {});
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
