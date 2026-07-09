import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { name?: string };
  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Workspace name must be at least 2 characters.' }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  // Find the user's org
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!org) {
    // Org doesn't exist yet — create it (safety net for users pre-migration)
    const { error } = await supabase
      .from('organizations')
      .insert({ name, slug, owner_id: user.id, onboarded_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Ensure slug uniqueness
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .neq('id', org.id)
    .maybeSingle();

  const finalSlug = existing ? `${slug}-${org.id.slice(0, 6)}` : slug;

  const { error } = await supabase
    .from('organizations')
    .update({ name, slug: finalSlug, onboarded_at: new Date().toISOString() })
    .eq('id', org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
