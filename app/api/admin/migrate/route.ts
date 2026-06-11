import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// One-shot migration runner — protected by MIGRATION_SECRET env var
export async function POST(req: Request) {
  const secret = req.headers.get('x-migration-secret');
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  // Run each migration via rpc or direct query
  const migrations = [
    {
      name: '036_event_staff',
      sql: `
        create table if not exists event_staff (
          id          uuid primary key default gen_random_uuid(),
          event_id    uuid not null references events(id) on delete cascade,
          owner_id    uuid not null references profiles(id) on delete cascade,
          email       text not null,
          role        text not null check (role in ('check_in','moderator','finance','manager')),
          status      text not null default 'pending' check (status in ('pending','active','removed')),
          expires     text default '24h_after',
          last_seen   timestamptz,
          invited_at  timestamptz default now(),
          created_at  timestamptz default now()
        );
        create index if not exists event_staff_event_idx on event_staff(event_id);
        create index if not exists event_staff_owner_idx on event_staff(owner_id);
      `,
    },
  ];

  const results: { name: string; ok: boolean; error?: string }[] = [];

  for (const m of migrations) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).rpc('exec_sql', { query: m.sql });
    if (error) {
      // Try direct query if rpc fails
      results.push({ name: m.name, ok: false, error: error.message });
    } else {
      results.push({ name: m.name, ok: true });
    }
  }

  return NextResponse.json({ results });
}
