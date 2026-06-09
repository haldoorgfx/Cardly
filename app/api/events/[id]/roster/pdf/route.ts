export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateRosterPDF } from '@/lib/pdf/roster-pdf';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const [{ data: event }, { data: regs }, { data: ticketTypes }] = await Promise.all([
      admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
      admin.from('registrations')
           .select('id, attendee_name, status, amount_paid, currency, ticket_type_id, created_at')
           .eq('event_id', id)
           .order('created_at', { ascending: true }),
      admin.from('ticket_types').select('id, name').eq('event_id', id),
    ]);

    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pdfBuffer = await generateRosterPDF(
      event.name,
      regs ?? [],
      ticketTypes ?? [],
    );

    const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const filename = `karta-roster-${slug}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const stack  = err instanceof Error ? err.stack : undefined;
    console.error('[roster/pdf]', err);
    return NextResponse.json({ error: 'Failed to generate PDF', detail, stack }, { status: 500 });
  }
}
