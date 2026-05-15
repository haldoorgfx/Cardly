"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signUp } from "../actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(15,31,24,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

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
            <a href="#" className="text-[#3A4A42] hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#3A4A42] hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </div>

      {/* Footer */}
      <p className="relative mt-8 text-center text-[12px] text-[#6B7A72]">
        © 2026 Cardly ·{" "}
        <a href="#" className="hover:text-[#3A4A42] transition">
          Privacy
        </a>{" "}
        ·{" "}
        <a href="#" className="hover:text-[#3A4A42] transition">
          Terms
        </a>
      </p>
    </div>
  );
}
