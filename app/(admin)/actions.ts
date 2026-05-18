"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function updateUserRole(
  userId: string,
  role: "user" | "admin" | "super_admin"
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  const { data: actorProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!actorProfile || !["admin", "super_admin"].includes(actorProfile.role ?? "")) {
    return { error: "Unauthorized" };
  }

  // Only super_admins can grant super_admin or admin roles to others
  if (role === "super_admin" && actorProfile.role !== "super_admin") {
    return { error: "Only super admins can grant the super admin role" };
  }

  // Prevent admins from promoting to admin (only super_admin can do that)
  if (role === "admin" && actorProfile.role !== "super_admin") {
    return { error: "Only super admins can grant the admin role" };
  }

  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
