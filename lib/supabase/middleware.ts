import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect all app routes.
  // Note: /events (exact) is the public discovery feed — allow through.
  // /e/* are public event pages — not protected.
  const isPublicEventsRoute =
    request.nextUrl.pathname === "/events" ||
    request.nextUrl.pathname.startsWith("/events/search") ||
    request.nextUrl.pathname.startsWith("/events/city/") ||
    request.nextUrl.pathname.startsWith("/events/category/");

  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    (request.nextUrl.pathname.startsWith("/events") && !isPublicEventsRoute) ||
    request.nextUrl.pathname.startsWith("/analytics") ||
    request.nextUrl.pathname.startsWith("/templates") ||
    request.nextUrl.pathname.startsWith("/brand") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname.startsWith("/team") ||
    request.nextUrl.pathname.startsWith("/admin");

  // Attendee-protected routes — redirect to /account/login (not /login)
  const isAttendeeProtected =
    request.nextUrl.pathname.startsWith("/my-tickets") ||
    request.nextUrl.pathname === "/account/profile" ||
    request.nextUrl.pathname.startsWith("/account/profile/") ||
    request.nextUrl.pathname === "/account/following" ||
    request.nextUrl.pathname.startsWith("/account/following/") ||
    request.nextUrl.pathname === "/account/notifications" ||
    request.nextUrl.pathname.startsWith("/account/notifications/");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAttendeeProtected && !user) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.pathname + request.nextUrl.search;
    url.pathname = "/account/login";
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup" ||
    request.nextUrl.pathname === "/forgot-password";

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
