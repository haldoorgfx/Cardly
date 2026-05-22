import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { CHANGELOG_VIEW, CHANGELOG_EDIT } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';

// GET /api/admin/changelog — list all entries (admin view, includes unpublished)
export async function GET() {
  const result = await getAuthorizedUser(CHANGELOG_VIEW);
  if ('error' in result) return result.error;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('changelog_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/changelog — create entry
export async function POST(request: Request) {
  const result = await getAuthorizedUser(CHANGELOG_EDIT);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('changelog_entries')
    .insert({
      version:     body.version     as string | null ?? null,
      title:       body.title       as string,
      description: body.description as string,
      type:        body.type        as 'added' | 'fixed' | 'improved' | 'removed' | 'security',
      published:   false,
      created_by:  user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'changelog.create', 'changelog_entry', data.id, {
    after: data as unknown as Record<string, unknown>,
  });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/changelog — update or publish/unpublish entry
export async function PATCH(request: Request) {
  const result = await getAuthorizedUser(CHANGELOG_EDIT);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const id = body.id as string;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const adminClient = createAdminClient();

  // Read before state for audit
  const { data: before } = await adminClient
    .from('changelog_entries').select('*').eq('id', id).single();

  type EntryUpdate = {
    version?: string | null;
    title?: string;
    description?: string;
    type?: 'added' | 'fixed' | 'improved' | 'removed' | 'security';
    published?: boolean;
    published_at?: string | null;
  };
  const update: EntryUpdate = {};
  if ('version'     in body) update.version     = body.version     as string | null;
  if ('title'       in body) update.title       = body.title       as string;
  if ('description' in body) update.description = body.description as string;
  if ('type'        in body) update.type        = body.type        as EntryUpdate['type'];
  if ('published'   in body) {
    update.published    = body.published as boolean;
    update.published_at = body.published ? new Date().toISOString() : null;
  }

  const { data, error } = await adminClient
    .from('changelog_entries')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'changelog.update', 'changelog_entry', id, {
    before: before as unknown as Record<string, unknown>,
    after:  data   as unknown as Record<string, unknown>,
  });

  return NextResponse.json(data);
}

// DELETE /api/admin/changelog — delete entry
export async function DELETE(request: Request) {
  const result = await getAuthorizedUser(CHANGELOG_EDIT);
  if ('error' in result) return result.error;
  const { user } = result;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const adminClient = createAdminClient();
  const { data: before } = await adminClient
    .from('changelog_entries').select('*').eq('id', id).single();

  const { error } = await adminClient
    .from('changelog_entries').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'changelog.delete', 'changelog_entry', id, {
    before: before as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true });
}
