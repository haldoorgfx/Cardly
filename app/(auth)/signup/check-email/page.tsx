"use client";

import Link from "next/link";

export default function CheckEmailPage() {
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
        className="relative w-full max-w-[400px] bg-white rounded-2xl px-8 py-10 text-center"
        style={{ border: "1px solid #E5E0D4", boxShadow: "0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)" }}
      >
        <div className="inline-flex h-12 w-12 rounded-2xl items-center justify-center mb-4" style={{ background: "rgba(31,77,58,0.08)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F1F18" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h1 className="text-[22px] font-bold text-[#0F1F18] tracking-tight mb-2">Check your inbox</h1>
        <p className="text-[14px] text-[#3A4A42] leading-relaxed mb-6">
          We sent a confirmation link to your email. Click it to activate your account and get started.
        </p>
        <p className="text-[13px] text-[#3A4A42] mb-6">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <Link href="/signup" className="text-[#1F4D3A] font-medium hover:underline">
            try again
          </Link>
          .
        </p>
        <Link
          href="/login"
          className="inline-block text-[13px] font-medium text-[#1F4D3A] hover:underline"
        >
          ← Back to sign in
        </Link>
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
