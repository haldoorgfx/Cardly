import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listIntegrations, toPublic } from '@/lib/integrations';

// GET /api/integrations — the caller's connected integrations (secrets redacted).
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const all = await listIntegrations(user.id);
  return NextResponse.json(toPublic(all));
}
