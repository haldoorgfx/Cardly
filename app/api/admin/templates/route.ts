import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { TEMPLATE_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import type { MinPlan } from '@/types/database';

const VALID_PLANS: MinPlan[] = ['free', 'pro', 'studio'];

// GET /api/admin/templates — list all templates (published and draft)
export async function GET() {
  const result = await getAuthorizedUser(TEMPLATE_MANAGE);
  if ('error' in result) return result.error;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

// POST /api/admin/templates — create a template
export async function POST(request: Request) {
  const result = await getAuthorizedUser(TEMPLATE_MANAGE);
  if ('error' in result) return result.error;
  const { user } = result;

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

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (body.min_plan && !VALID_PLANS.includes(body.min_plan as MinPlan)) {
    return NextResponse.json({ error: 'Invalid min_plan' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('templates')
    .insert({
      name:           body.name.trim(),
      category:       body.category?.trim() || null,
      thumbnail_url:  body.thumbnail_url?.trim() || null,
      background_url: body.background_url?.trim() || null,
      min_plan:       (body.min_plan as MinPlan) ?? 'free',
      featured:       body.featured ?? false,
      published:      body.published ?? false,
      created_by:     user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'template.created', 'template', data.id, {
    after: { name: data.name, min_plan: data.min_plan, published: data.published },
  });

  return NextResponse.json({ template: data }, { status: 201 });
}
