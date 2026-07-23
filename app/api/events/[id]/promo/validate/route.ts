import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { roundToCurrencyUnit } from '@/lib/payments/currency';
import { z } from 'zod';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

const BodySchema = z.object({
  code: z.string().min(1),
  ticket_type_id: z.string().uuid().optional(),
  amount: z.number().nonnegative(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('promote'))) return NextResponse.json({ error: 'Promote is currently unavailable.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { code, amount, ticket_type_id } = parsed.data;
  const admin = createAdminClient();

  // This endpoint only QUOTES a discount — /register recomputes it server-side
  // from the code and is the sole authority on what is charged. We still round
  // the quote the same way /register does, so a zero-decimal currency (DJF/UGX/
  // XOF …) never shows the attendee a figure with cents they can't be charged.
  let currency: string | null = null;
  if (ticket_type_id) {
    const { data: t } = await admin
      .from('ticket_types')
      .select('currency')
      .eq('id', ticket_type_id)
      .eq('event_id', params.id)
      .maybeSingle();
    currency = t?.currency ?? null;
  }

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

  const rawDiscount =
    promo.discount_type === 'percent'
      ? Math.min(amount, (amount * Number(promo.discount_value)) / 100)
      : Math.min(amount, Number(promo.discount_value));
  const discount = roundToCurrencyUnit(rawDiscount, currency);

  return NextResponse.json({
    valid: true,
    promo_code_id: promo.id,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: discount,
    final_amount: Math.max(0, roundToCurrencyUnit(amount - discount, currency)),
  });
}
