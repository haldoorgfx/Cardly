import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConnectStatus, disconnectConnect } from '@/lib/integrations/stripe-connect';

// GET /api/integrations/stripe — organizer's Stripe Connect status.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ configured: false, connected: false, chargesEnabled: false });
  }
  const status = await getConnectStatus(user.id);
  return NextResponse.json({ configured: true, ...status });
}

// DELETE /api/integrations/stripe — forget the connected account (local unlink).
export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await disconnectConnect(user.id);
  return NextResponse.json({ ok: true });
}
