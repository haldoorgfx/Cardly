import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { transferRegistration } from '@/lib/registration/transfer';

export const dynamic = 'force-dynamic';

/**
 * Legacy alias for POST /api/tickets/[id]/transfer.
 *
 * Kept because it is a published endpoint shape (snake_case body), but it no
 * longer carries its own copy of the transfer logic — both routes now call
 * `transferRegistration()`, so they cannot drift on token rotation, ownership
 * proof, or the concurrency guard.
 */
const schema = z.object({
  to_name:  z.string().min(1).max(200).trim(),
  to_email: z.string().email().max(254).transform(v => v.toLowerCase().trim()),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Name and valid email are required.' }, { status: 400 });

  const result = await transferRegistration({
    registrationId: params.id,
    userId: user.id,
    userEmail: user.email,
    toName: parsed.data.to_name,
    toEmail: parsed.data.to_email,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
