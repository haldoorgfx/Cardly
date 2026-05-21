/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/guards';
import { IMPERSONATE } from '@/lib/auth/permissions';
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';

function canImpersonate(role: string): boolean {
  return (ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] ?? []).includes(IMPERSONATE);
}

// GET /api/admin/impersonate — return the impersonated user's profile + event count
// (called by AppShell when it detects the karta_impersonating cookie)
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionUser = await getSessionUser();
  if (!sessionUser || !canImpersonate(sessionUser.role)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const targetId = req.cookies.get('karta_impersonating')?.value;
  if (!targetId) return NextResponse.json({ impersonating: null });

  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, email, plan, role')
    .eq('id', targetId)
    .single();

  if (!profile) return NextResponse.json({ impersonating: null });

  const { count } = await db
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', targetId)
    .neq('status', 'archived');

  return NextResponse.json({
    impersonating: {
      ...profile,
      eventCount: count ?? 0,
    },
  });
}

// POST /api/admin/impersonate — start impersonating a user
// Body: { userId: string }
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionUser = await getSessionUser();
  if (!sessionUser || !canImpersonate(sessionUser.role)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }

  // Can't impersonate yourself
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot impersonate yourself.' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: target } = await db.from('profiles').select('id, full_name, email').eq('id', userId).single();
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('karta_impersonating', userId, {
    httpOnly: false, // readable by AppShell client-side
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours
    sameSite: 'lax',
  });
  return res;
}

// DELETE /api/admin/impersonate — stop impersonating
export async function DELETE() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('karta_impersonating', '', { path: '/', maxAge: 0 });
  return res;
}
