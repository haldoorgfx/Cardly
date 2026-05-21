import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  // Step 1: refresh auth session cookies (handles unauthenticated → /login redirect)
  const response = await updateSession(request);

  // Step 2: /admin/** additionally requires admin or super_admin role.
  // updateSession handles "not logged in" already; here we handle "logged in but wrong role".
  if (request.nextUrl.pathname.startsWith("/admin")) {
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

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role;
      if (role !== "admin" && role !== "super_admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
    // If !user, updateSession already returned a redirect-to-login response
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
