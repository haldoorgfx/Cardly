import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ code: z.string().min(1).max(100) });

// Returns hidden tickets unlocked by the given access code.
// Never returns the access_code field itself — just the ticket data.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ tickets: [] });

  const admin = createAdminClient();

  // Find hidden tickets for this event whose code matches
  const { data } = await admin
    .from('ticket_types')
    .select('id, name, description, price, currency, quantity, quantity_sold, min_price, min_per_order, max_per_order, sales_start, sales_end')
    .eq('event_id', params.id)
    .eq('is_visible', false)
    .eq('access_code', parsed.data.code);

  // Return tickets without access_code field
  return NextResponse.json({ tickets: data ?? [] });
}
