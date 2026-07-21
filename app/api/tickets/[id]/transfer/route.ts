import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { transferRegistration } from '@/lib/registration/transfer';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  recipientEmail: z.string().email().max(254).transform(v => v.toLowerCase().trim()),
  recipientName: z.string().min(1).max(200).trim(),
});

/**
 * Transfer a ticket (registration) to another person — the route the web client
 * calls. All of the actual rules (ownership proof, transferable status, paid
 * check, token rotation, compare-and-swap against concurrent transfers, audit
 * log, recipient email) live in `lib/registration/transfer.ts` and are shared
 * with the legacy /api/registrations/[id]/transfer alias.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A recipient name and a valid email are required.' }, { status: 400 });
  }

  const result = await transferRegistration({
    registrationId: id,
    userId: user.id,
    userEmail: user.email,
    toName: parsed.data.recipientName,
    toEmail: parsed.data.recipientEmail,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
