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
    <div className="min-h-screen flex">
      {/* ── Left panel: brand visual ── */}
      <div
        className="hidden md:flex md:w-[45%] lg:w-[52%] relative flex-col overflow-hidden"
        style={{ background: "#0F1F18" }}
      >
        {/* Mesh gradient blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-20%",
            left: "-10%",
            width: "550px",
            height: "550px",
            background:
              "radial-gradient(ellipse, rgba(31,77,58,0.85) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-10%",
            right: "-10%",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(232,197,126,0.2) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Top edge glow */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(232,197,126,0.5), transparent, rgba(232,197,126,0.2))",
          }}
        />

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-between p-10 lg:p-12">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-white font-semibold text-[17px] tracking-tight">
              Cardly
            </span>
          </Link>

          {/* Center */}
          <div>
            <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase mb-5">
              Free to start
            </div>
            <h2 className="text-[30px] lg:text-[36px] font-bold text-white leading-tight tracking-tight">
              Design once,
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #E8C57E 0%, #a8d5a2 50%, #2A9E64 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                share everywhere.
              </span>
            </h2>
            <p className="mt-4 text-white/40 text-[14px] leading-relaxed max-w-[280px]">
              Upload your event design, define zones, share one link.
              Attendees personalize it themselves.
            </p>

            {/* Feature list */}
            <div className="mt-10 space-y-3">
              {[
                "Free — no credit card required",
                "Full editor access on every plan",
                "Attendees need no account",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(31,77,58,0.5)",
                      border: "1px solid rgba(31,77,58,0.8)",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a8d5a2"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-[13px] text-white/55">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#E8C57E" }}
            />
            <p className="text-[12px] text-white/25">
              Join 1,000+ event organizers across Africa
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white relative">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(rgba(15,31,24,0.07) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative w-full max-w-[360px]">
          {/* Logo — mobile only */}
          <div className="md:hidden text-center mb-10">
            <Link href="/">
              <span className="text-[22px] font-semibold text-[#0F1F18] tracking-tight">
                Cardly
              </span>
            </Link>
          </div>

          {/* Heading */}
          <h1 className="text-[24px] font-bold text-[#0F1F18] tracking-tight mb-1">
            Create your account
          </h1>
          <p className="text-[14px] text-neutral-500 mb-8">
            Already have one?{" "}
            <Link
              href="/login"
              className="text-[#1F4D3A] font-medium hover:underline"
            >
              Sign in →
            </Link>
          </p>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                Full name
              </label>
              <input
                name="full_name"
                type="text"
                required
                placeholder="Your name"
                className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/15 focus:border-[#1F4D3A]/40 transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@studio.com"
                className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/15 focus:border-[#1F4D3A]/40 transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/15 focus:border-[#1F4D3A]/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-10 text-white text-[14px] font-semibold rounded-lg disabled:opacity-50 transition"
              style={{ background: "#0F1F18" }}
            >
              {isPending ? "Creating account…" : "Create account"}
            </button>

            <p className="text-[12px] text-neutral-400 text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <a href="#" className="text-neutral-500 hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-neutral-500 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-[12px] text-neutral-400">
            © 2026 Cardly ·{" "}
            <a href="#" className="hover:text-neutral-600 transition">
              Privacy
            </a>{" "}
            ·{" "}
            <a href="#" className="hover:text-neutral-600 transition">
              Terms
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
