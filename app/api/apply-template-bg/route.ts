import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

/**
 * POST /api/apply-template-bg
 * Body: { variantId: string, templateId: string }
 *
 * Copies a template's background image onto a variant.
 * Returns { backgroundUrl, width, height }.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { variantId?: string; templateId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { variantId, templateId } = body;
  if (!variantId || !templateId) {
    return NextResponse.json({ error: 'variantId and templateId are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the template
  const { data: template } = await admin
    .from('templates')
    .select('background_url, dimensions')
    .eq('id', templateId)
    .eq('published', true)
    .single();

  if (!template?.background_url) {
    return NextResponse.json({ error: 'Template not found or has no background' }, { status: 404 });
  }

  const dims = template.dimensions as { width?: number; height?: number } | null;
  const width  = dims?.width  ?? 1080;
  const height = dims?.height ?? 1350;

  // Verify the variant belongs to this user
  const { data: variant } = await admin
    .from('event_variants')
    .select('id, event_id')
    .eq('id', variantId)
    .single();

  if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', variant.event_id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();

  if (!event) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Update the variant's background
  const { error: updateError } = await admin
    .from('event_variants')
    .update({
      background_url: template.background_url,
      background_width: width,
      background_height: height,
    })
    .eq('id', variantId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    backgroundUrl: template.background_url,
    width,
    height,
  });
}
