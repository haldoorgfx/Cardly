/**
 * GET /api/events/[id]/export
 * Returns a CSV of all generated cards for the event.
 *
 * Columns: card_id, created_at, attendee_name, [all zone field keys]
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { escapeCsvCell } from '@/lib/csv';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();

  // Verify ownership
  const { data: event } = await db
    .from('events')
    .select('id, name')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: cards } = await db
    .from('generated_cards')
    .select('id, attendee_name, attendee_data, created_at')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false });

  const rows = cards ?? [];

  // Collect all unique field keys (skip internal _city, _lat, etc.)
  const allKeys = new Set<string>();
  for (const row of rows) {
    const d = row.attendee_data as Record<string, unknown> | null;
    if (d) {
      for (const k of Object.keys(d)) {
        if (!k.startsWith('_')) allKeys.add(k);
      }
    }
  }
  const extraKeys = Array.from(allKeys).sort();

  // Build CSV
  const header = ['card_id', 'created_at', 'attendee_name', ...extraKeys];
  // Shared escaper. attendee_data holds free-text custom form answers, so this
  // must both quote commas/quotes/newlines and defuse spreadsheet formula
  // injection (a cell starting with = + - @ executes when the organizer opens it).
  const escape = (v: unknown): string => escapeCsvCell(v as string | number | null | undefined);

  const lines: string[] = [header.join(',')];
  for (const row of rows) {
    const d = row.attendee_data as Record<string, unknown> | null;
    const cells = [
      row.id,
      row.created_at,
      row.attendee_name ?? '',
      ...extraKeys.map(k => (d ? d[k] : '')),
    ];
    lines.push(cells.map(escape).join(','));
  }

  const csv = lines.join('\r\n');
  const filename = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-cards.csv';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
