import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// ── Launch-day env resilience ──────────────────────────────────────────────
// A MISSING Supabase var is the #1 silent-failure mode: the placeholder
// fallbacks below keep the build green, but at runtime every query points at
// `placeholder.supabase.co` and returns nothing — so pages 404 / notFound()
// with no obvious cause. We DON'T crash (that would take the whole site down),
// but we log a loud, one-time server-side warning naming the missing var so
// it's diagnosable from the Vercel logs. Names only — never values.
let _envChecked = false;
let _serviceKeyWarned = false;
function warnIfSupabaseEnvMissing() {
  if (_envChecked) return;
  _envChecked = true;
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length > 0) {
    console.error(
      `[supabase] CRITICAL: missing env var(s) [${missing.join(", ")}] — ` +
        `using placeholder credentials. Data reads/writes WILL fail and pages ` +
        `may 404. Set these in the Vercel production environment.`,
    );
  }
}

export function createClient() {
  warnIfSupabaseEnvMissing();
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key-for-build',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies will be set in middleware
          }
        },
      },
    }
  );
}

// Service role client — bypasses RLS, use only in trusted server-side routes
// after manually verifying auth with createClient().auth.getUser()
export function createAdminClient() {
  warnIfSupabaseEnvMissing();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !_serviceKeyWarned) {
    _serviceKeyWarned = true;
    console.error(
      "[supabase] CRITICAL: missing env var [SUPABASE_SERVICE_ROLE_KEY] — " +
        "admin client is using a placeholder key. Every server-side admin " +
        "query (registration, event pages, payments) WILL fail. Set this in " +
        "the Vercel production environment.",
    );
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key-for-build',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
