import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  // Step 1: refresh auth session cookies (handles unauthenticated → /login redirect)
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Skip role/suspension checks for fully public routes
  const isPublicRoute =
    pathname.startsWith("/c/") ||       // attendee public pages
    pathname.startsWith("/auth") ||
    pathname === "/suspended" ||
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/whats-new") ||
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
