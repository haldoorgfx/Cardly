import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { Database } from "@/types/database";
import { checkRateLimit } from "@/lib/ratelimit";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Step 0: Rate limiting on all /api/* routes ──────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    const rl = await checkRateLimit(pathname, ip);
    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rl.retryAfter),
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + rl.retryAfter),
          },
        },
      );
    }
  }

  // ── Step 1: refresh auth session cookies (handles unauthenticated → /login redirect)
  const response = await updateSession(request);


  // "isPublicRoute" means: skip the suspension/admin-role DB checks below.
  // It does NOT mean "no auth required" — unauthenticated users are already
  // redirected to /login by updateSession() above before reaching this point.
  // Routes like /my-tickets and /saved still require auth; they're listed here
  // only so suspended users can still reach their own tickets/saved items.
  const isPublicRoute =
    pathname.startsWith("/c/") ||       // attendee public pages
    pathname.startsWith("/e/") ||       // public event pages
    pathname.startsWith("/exhibitor/") || // exhibitor portal (token-gated, not auth-gated)
    pathname === "/events" ||           // public event discovery feed
    pathname.startsWith("/events/search") ||
    pathname.startsWith("/events/city/") ||
    pathname.startsWith("/events/cities") ||
    pathname.startsWith("/events/category/") ||
    pathname.startsWith("/auth") ||
    pathname === "/suspended" ||
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/whats-new") ||
    pathname === "/discover" ||
    pathname.startsWith("/discover/") ||
    pathname === "/search" ||
    pathname.startsWith("/search/") ||
    pathname.startsWith("/o/") ||       // organizer public profiles
    pathname.startsWith("/s/") ||       // speaker public profiles
    pathname.startsWith("/x/") ||       // exhibitor public profiles
    pathname === "/my-tickets" ||
    pathname.startsWith("/my-tickets/") ||
    pathname === "/saved" ||
    pathname.startsWith("/saved/") ||
    pathname === "/home" ||             // adaptive role hub — any authed account
    pathname === "/speaking" ||         // speaker surface — any authed account
    pathname === "/sponsoring" ||       // sponsor surface — any authed account
    pathname.startsWith("/api/");       // API routes enforce permissions internally

  if (isPublicRoute) return response;

  // Single Supabase client for both suspension + admin-role checks
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Session already refreshed by updateSession above — no-op here
        },
      },
    }
  );

  // Use getSession() here — updateSession() already called getUser() (a network
  // round-trip) to refresh the cookie. Reading the session from the refreshed
  // cookie is safe for role/suspension checks and avoids a second auth server hit.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Not logged in — updateSession already redirected; nothing more to do
  if (!user) return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, suspended")
    .eq("id", user.id)
    .single();

  // Suspended users (non-admin) are blocked from all app routes
  if (
    profile?.suspended === true &&
    profile.role !== "admin" &&
    profile.role !== "super_admin"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/suspended";
    return NextResponse.redirect(url);
  }

  // /admin/** requires admin or super_admin role
  if (pathname.startsWith("/admin")) {
    const role = profile?.role;
    if (role !== "admin" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
