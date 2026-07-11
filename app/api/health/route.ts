import { NextResponse } from 'next/server';

// Lightweight liveness + config probe for launch-day monitoring / uptime pings.
// Reports WHICH critical env vars are present (booleans only — never values) so
// a misconfigured deploy is diagnosable from `GET /api/health` without exposing
// secrets. Always returns 200 so an uptime monitor treats the app as "up"; the
// `config.ok` flag signals whether the core env is wired.
export const dynamic = 'force-dynamic';

export function GET() {
  const env = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  };

  const configOk = env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey && env.appUrl;

  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    config: { ok: configOk, env },
  });
}
