/**
 * lib/admin/queries.ts
 *
 * Shared query helpers for admin API routes and server components.
 * All functions use createAdminClient() (service-role) — call only from server-side code.
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

export type AdminUserRow = Database['public']['Tables']['profiles']['Row'] & {
  event_count?: number;
};

export interface UserListOptions {
  search?: string;
  role?: string;
  plan?: string;
  status?: 'active' | 'suspended';
  page?: number;
  pageSize?: number;
}

export interface UserListResult {
  users: AdminUserRow[];
  total: number;
}

/**
 * Paginated user list with optional search + filters.
 * Returns profiles joined with event counts.
 */
export async function listUsers(opts: UserListOptions = {}): Promise<UserListResult> {
  const supabase = createAdminClient();
  const { search, role, plan, status, page = 1, pageSize = 50 } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq('role', role as import('@/types/database').UserRole);
  }
  if (plan) {
    query = query.eq('plan', plan as import('@/types/database').Plan);
  }
  if (status === 'suspended') {
    query = query.eq('suspended', true);
  } else if (status === 'active') {
    query = query.eq('suspended', false);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { users: (data ?? []) as AdminUserRow[], total: count ?? 0 };
}

/**
 * Single user profile for detail view.
 */
export async function getUserById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Count of events owned by a user.
 */
export async function getUserEventCount(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return 0;
  return count ?? 0;
}

/**
 * Count of generated cards by a user (via their events).
 */
export async function getUserCardCount(userId: string): Promise<number> {
  const supabase = createAdminClient();
  // Get event IDs for this user first
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('user_id', userId);

  if (!events?.length) return 0;
  const eventIds = events.map((e) => e.id);

  const { count, error } = await supabase
    .from('generated_cards')
    .select('id', { count: 'exact', head: true })
    .in('event_id', eventIds);
  if (error) return 0;
  return count ?? 0;
}

// ── Analytics ─────────────────────────────────────────────────

export interface PlatformStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalEvents: number;
  publishedEvents: number;
  totalCards: number;
  totalRegistrations: number;
  paidUsers: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalUsers },
    { count: newUsersThisMonth },
    { count: totalEvents },
    { count: publishedEvents },
    { count: totalCards },
    { count: totalRegistrations },
    { count: paidUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('generated_cards').select('id', { count: 'exact', head: true }),
    supabase.from('registrations').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'checked_in']),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).in('plan', ['pro', 'studio']),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    newUsersThisMonth: newUsersThisMonth ?? 0,
    totalEvents: totalEvents ?? 0,
    publishedEvents: publishedEvents ?? 0,
    totalCards: totalCards ?? 0,
    totalRegistrations: totalRegistrations ?? 0,
    paidUsers: paidUsers ?? 0,
  };
}

/** User growth: sign-ups per day for the last N days */
export async function getUserGrowth(days = 30): Promise<{ date: string; count: number }[]> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  // Bucket by date string
  const counts: Record<string, number> = {};
  for (const row of data) {
    const d = row.created_at.slice(0, 10); // YYYY-MM-DD
    counts[d] = (counts[d] ?? 0) + 1;
  }

  // Fill in zero-days
  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    result.push({ date: d, count: counts[d] ?? 0 });
  }
  return result;
}

/** Cards generated per day for the last N days */
export async function getCardGrowth(days = 30): Promise<{ date: string; count: number }[]> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('generated_cards')
    .select('created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    const d = row.created_at.slice(0, 10);
    counts[d] = (counts[d] ?? 0) + 1;
  }

  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    result.push({ date: d, count: counts[d] ?? 0 });
  }
  return result;
}

/** Plan distribution */
export async function getPlanDistribution(): Promise<{ plan: string; count: number }[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('plan');

  if (error || !data) return [];

  const counts: Record<string, number> = { free: 0, pro: 0, studio: 0 };
  for (const row of data) {
    counts[row.plan ?? 'free'] = (counts[row.plan ?? 'free'] ?? 0) + 1;
  }
  return Object.entries(counts).map(([plan, count]) => ({ plan, count }));
}
