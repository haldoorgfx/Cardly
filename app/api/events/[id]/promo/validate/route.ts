import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const BodySchema = z.object({
  code: z.string().min(1),
  ticket_type_id: z.string().uuid().optional(),
  amount: z.number().nonnegative(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { code, amount } = parsed.data;
  const admin = createAdminClient();

  const { data: promo } = await admin
    .from('promo_codes')
    .select('*')
    .eq('event_id', params.id)
    .eq('code', code.toUpperCase())
    .single();

  if (!promo) return NextResponse.json({ valid: false, error: 'Code not found' });

  const now = new Date();
  if (promo.valid_from && new Date(promo.valid_from) > now)
    return NextResponse.json({ valid: false, error: 'Code not active yet' });
  if (promo.valid_until && new Date(promo.valid_until) < now)
    return NextResponse.json({ valid: false, error: 'Code expired' });
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses)
    return NextResponse.json({ valid: false, error: 'Code usage limit reached' });

  const discount =
    promo.discount_type === 'percent'
      ? Math.min(amount, (amount * Number(promo.discount_value)) / 100)
      : Math.min(amount, Number(promo.discount_value));

  return NextResponse.json({
    valid: true,
    promo_code_id: promo.id,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: Math.round(discount * 100) / 100,
    final_amount: Math.max(0, amount - discount),
  });
}
