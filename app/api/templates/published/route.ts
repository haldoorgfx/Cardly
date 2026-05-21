import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, studio: 2 };

// GET /api/templates/published — returns DB-backed templates the current user can access
// Authenticated; filters by user's plan tier.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ templates: [] });

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const userPlanLevel = PLAN_ORDER[profile?.plan ?? 'free'] ?? 0;

  const adminClient = createAdminClient();
  const { data: templates, error } = await adminClient
    .from('templates')
    .select('id, name, category, thumbnail_url, min_plan, featured')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !templates) return NextResponse.json({ templates: [] });

  // Filter by min_plan access
  const accessible = templates.filter(t => {
    const needed = PLAN_ORDER[t.min_plan] ?? 0;
    return userPlanLevel >= needed;
  });

  return NextResponse.json({ templates: accessible });
}
