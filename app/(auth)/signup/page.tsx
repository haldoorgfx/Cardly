"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signUp } from "../actions";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  async function handleGoogleSignIn() {
    setGooglePending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      {/* Mesh gradient blob — top left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "-8%",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(ellipse, rgba(31,77,58,0.12) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      {/* Mesh gradient blob — bottom right */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          right: "-8%",
          width: "420px",
          height: "420px",
          background:
            "radial-gradient(ellipse, rgba(232,197,126,0.14) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Logo */}
      <div className="relative mb-8">
        <Link href="/">
          <span className="text-[22px] font-semibold text-[#0F1F18] tracking-tight">
            Cardly
          </span>
        </Link>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-[400px] bg-white rounded-2xl px-8 py-10"
        style={{
          border: "1px solid #E5E0D4",
          boxShadow:
            "0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)",
        }}
      >
        <h1 className="text-[22px] font-bold text-[#0F1F18] tracking-tight mb-1">
          Create your account
        </h1>
        <p className="text-[14px] text-[#6B7A72] mb-7">
          Already have one?{" "}
          <Link
            href="/login"
            className="text-[#1F4D3A] font-medium hover:underline"
          >
            Sign in →
          </Link>
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#3A4A42] mb-1.5">
              Full name
            </label>
            <input
              name="full_name"
              type="text"
              required
              placeholder="Your name"
              className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 transition focus:outline-none"
              style={{
                borderColor: "#E5E0D4",
                background: "#FAF6EE",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(31,77,58,0.4)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(31,77,58,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E0D4";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#3A4A42] mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@studio.com"
              className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 transition focus:outline-none"
              style={{
                borderColor: "#E5E0D4",
                background: "#FAF6EE",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(31,77,58,0.4)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(31,77,58,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E0D4";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#3A4A42] mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 transition focus:outline-none"
              style={{
                borderColor: "#E5E0D4",
                background: "#FAF6EE",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(31,77,58,0.4)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(31,77,58,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E0D4";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-10 text-white text-[14px] font-semibold rounded-lg disabled:opacity-50 transition hover:opacity-90"
            style={{ background: "#1F4D3A" }}
          >
            {isPending ? "Creating account…" : "Create account"}
          </button>

          <p className="text-[12px] text-[#6B7A72] text-center leading-relaxed">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-[#3A4A42] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#3A4A42] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        <div className="flex items-center gap-3 mt-5">
          <div className="flex-1 h-px" style={{ background: "#E5E0D4" }} />
          <span className="text-[12px] text-[#6B7A72]">or</span>
          <div className="flex-1 h-px" style={{ background: "#E5E0D4" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googlePending || isPending}
          className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg border text-[14px] font-medium text-[#0F1F18] transition hover:bg-[#FAF6EE] disabled:opacity-50 mt-5"
          style={{ borderColor: "#E5E0D4" }}
        >
          {googlePending ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          )}
          Continue with Google
        </button>
      </div>

      {/* Footer */}
      <p className="relative mt-8 text-center text-[12px] text-[#6B7A72]">
        © 2026 Cardly ·{" "}
        <Link href="/privacy" className="hover:text-[#3A4A42] transition">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="hover:text-[#3A4A42] transition">
          Terms
        </Link>
      </p>
    </div>
  );
}
