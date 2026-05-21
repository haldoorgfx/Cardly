import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { TEMPLATE_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import type { MinPlan, Database } from '@/types/database';
type TemplateUpdate = Database['public']['Tables']['templates']['Update'];

const VALID_PLANS: MinPlan[] = ['free', 'pro', 'studio'];

// PATCH /api/admin/templates/[id] — update a template
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const result = await getAuthorizedUser(TEMPLATE_MANAGE);
  if ('error' in result) return result.error;
  const { user } = result;

  const adminClient = createAdminClient();
  const { data: before } = await adminClient
    .from('templates')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  let body: {
    name?: string;
    category?: string;
    thumbnail_url?: string;
    background_url?: string;
    min_plan?: string;
    featured?: boolean;
    published?: boolean;
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (body.min_plan && !VALID_PLANS.includes(body.min_plan as MinPlan)) {
    return NextResponse.json({ error: 'Invalid min_plan' }, { status: 400 });
  }

  const updatePayload: TemplateUpdate = { updated_at: new Date().toISOString() };
  if (body.name      !== undefined) updatePayload.name           = body.name.trim();
  if (body.category  !== undefined) updatePayload.category       = body.category?.trim() || null;
  if (body.thumbnail_url  !== undefined) updatePayload.thumbnail_url  = body.thumbnail_url?.trim() || null;
  if (body.background_url !== undefined) updatePayload.background_url = body.background_url?.trim() || null;
  if (body.min_plan  !== undefined) updatePayload.min_plan        = body.min_plan as MinPlan;
  if (body.featured  !== undefined) updatePayload.featured        = body.featured;
  if (body.published !== undefined) updatePayload.published       = body.published;

  const { data: after, error } = await adminClient
    .from('templates')
    .update(updatePayload)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'template.updated', 'template', params.id, {
    before: { name: before.name, published: before.published, min_plan: before.min_plan, featured: before.featured },
    after:  { name: after.name,  published: after.published,  min_plan: after.min_plan,  featured: after.featured  },
  });

  return NextResponse.json({ template: after });
}

// DELETE /api/admin/templates/[id] — delete a template
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const result = await getAuthorizedUser(TEMPLATE_MANAGE);
  if ('error' in result) return result.error;
  const { user } = result;

  const adminClient = createAdminClient();
  const { data: before } = await adminClient
    .from('templates')
    .select('id, name')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  const { error } = await adminClient
    .from('templates')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'template.deleted', 'template', params.id, {
    before: { name: before.name },
  });

  return NextResponse.json({ ok: true });
}
