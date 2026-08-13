"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { resetPassword } from "../actions";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    startTransition(async () => {
      const result = await resetPassword(email);
      if (result?.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      <div className="relative mb-8">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eventera-logo.png" alt="Eventera" style={{ height: '28px', objectFit: 'contain' }} />
        </Link>
      </div>

      <div
        className="relative w-full max-w-[400px] bg-white rounded-2xl px-8 py-10"
        style={{ border: "1px solid #E5E0D4", boxShadow: "0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)" }}
      >
        {sent ? (
          <div className="text-center">
            <div className="inline-flex h-12 w-12 rounded-2xl items-center justify-center mb-4" style={{ background: "rgba(31,77,58,0.08)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F1F18" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 className="text-[20px] font-bold text-[#0F1F18] tracking-tight mb-2">Check your inbox</h1>
            <p className="text-[14px] text-[#3A4A42] leading-relaxed mb-6">
              We sent a password reset link to your email. Click it to set a new password.
            </p>
            <Link href="/login" className="text-[13px] font-medium text-[#1F4D3A] hover:underline">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[22px] font-bold text-[#0F1F18] tracking-tight mb-1">Forgot password?</h1>
            <p className="text-[14px] text-[#3A4A42] mb-7">
              Enter your email and we&apos;ll send you a reset link.{" "}
              <Link href="/login" className="text-[#1F4D3A] font-medium hover:underline">Sign in →</Link>
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-[#3A4A42] mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  aria-invalid={!!error}
                  placeholder="you@studio.com"
                  className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#65736B]/60 transition focus:outline-none"
                  style={{ borderColor: "#E5E0D4", background: "#FAF6EE" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(31,77,58,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(31,77,58,0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#E5E0D4"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-10 text-white text-[14px] font-semibold rounded-lg disabled:opacity-50 transition hover:opacity-90"
                style={{ background: "#1F4D3A" }}
              >
                {isPending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="relative mt-8 text-center text-[12px] text-[#3A4A42]">
        © 2026 Eventera ·{" "}
        <Link href="/privacy" className="underline-offset-2 hover:underline transition">Privacy</Link>
        {" · "}
        <Link href="/terms" className="underline-offset-2 hover:underline transition">Terms</Link>
      </p>
    </div>
  );
}
