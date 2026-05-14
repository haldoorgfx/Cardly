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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-[22px] font-semibold text-[#0F1F18] tracking-tight">Cardly</span>
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-[#0F1F18] mb-1">Create your account</h1>
        <p className="text-[14px] text-neutral-500 mb-6">
          Already have one?{" "}
          <Link href="/login" className="text-[#0F1F18] font-medium hover:underline">
            Sign in →
          </Link>
        </p>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1">
              Full name
            </label>
            <input
              name="full_name"
              type="text"
              required
              placeholder="Your name"
              className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@studio.com"
              className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-10 bg-[#0F1F18] text-white text-[14px] font-medium rounded-md hover:bg-neutral-800 disabled:opacity-50 transition"
          >
            {isPending ? "Creating account…" : "Create account"}
          </button>

          <p className="text-[12px] text-neutral-400 text-center leading-relaxed">
            By creating an account you agree to our{" "}
            <a href="#" className="text-neutral-600 hover:underline">Terms</a>
            {" "}and{" "}
            <a href="#" className="text-neutral-600 hover:underline">Privacy Policy</a>.
          </p>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-[12px] text-neutral-400">
          © 2026 Cardly ·{" "}
          <a href="#" className="hover:text-neutral-600 transition">Privacy</a>
          {" · "}
          <a href="#" className="hover:text-neutral-600 transition">Terms</a>
        </p>
      </div>
    </div>
  );
}
