"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { safeNextPath as safeNext } from "@/lib/auth/safe-next";

export async function signIn(formData: FormData) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    // Map technical Supabase codes to human copy
    const msgMap: Record<string, string> = {
      'Invalid login credentials':    'Incorrect email or password.',
      'Email not confirmed':          'Please confirm your email address before signing in.',
      'Too many requests':            'Too many attempts. Please wait a minute and try again.',
    };
    const human = msgMap[error.message] ?? error.message;
    return { error: human };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")) ?? "/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = createClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const next = safeNext(formData.get("next"));
  const callbackUrl = `${appUrl}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;

  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: { full_name: formData.get("full_name") as string },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Fire-and-forget welcome email — never blocks the redirect
  const email = formData.get("email") as string;
  const name = (formData.get("full_name") as string) || email;
  sendWelcomeEmail({ to: email, name }).catch(() => {});

  revalidatePath("/", "layout");

  // If email confirmation is enabled, session is null — send to check-email page
  if (!data.session) {
    redirect("/signup/check-email");
  }

  redirect(next ?? "/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback?next=/settings/reset-password`,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Delegates to the shared implementation. This used to call
  // admin.auth.admin.deleteUser() directly, which skipped every guard the API
  // route applied — and since Settings wires the delete button to THIS action,
  // the path most users actually reached was the least safe one.
  const { deleteOwnAccount } = await import('@/lib/account/delete');
  const result = await deleteOwnAccount(user.id);
  if (!result.ok) return { error: result.error };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const password = formData.get('password') as string;
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  // Changing a password has to end every OTHER session. The whole reason a user
  // reaches this screen is often "someone else got in" — if the attacker's
  // refresh token survives the reset, the reset accomplished nothing. 'others'
  // keeps the current device signed in so the user isn't bounced to /login
  // straight after succeeding. Best-effort: the password change already
  // committed, so a revoke failure must not be reported as a failed reset.
  await supabase.auth.signOut({ scope: 'others' }).catch(() => {});

  return { ok: true };
}

export async function updateEmail(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const email = formData.get('email') as string;
  if (!email) return { error: 'Email is required.' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${appUrl}/auth/callback` }
  );
  if (error) return { error: error.message };
  return { ok: true };
}

export async function signOutAllDevices() {
  const supabase = createClient();
  await supabase.auth.signOut({ scope: 'global' });
  revalidatePath("/", "layout");
  redirect("/login");
}
