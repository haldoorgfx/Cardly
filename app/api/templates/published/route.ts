import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/templates/published
 * Returns admin-managed templates that have been published, for the
 * "Platform templates" section of the user-facing /templates page.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('templates')
    .select('id, name, category, thumbnail_url, min_plan, featured')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200); // perf cap — platform template catalogue

  // Degrade gracefully — a transient schema-cache miss or empty table should
  // never break the user-facing templates grid (it has its own built-in set).
  if (error) return NextResponse.json({ templates: [] });
  return NextResponse.json({ templates: data ?? [] });
}
