"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signIn } from "../actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signIn(formData);
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
            top: "-15%",
            right: "-10%",
            width: "500px",
            height: "500px",
            background:
              "radial-gradient(ellipse, rgba(31,77,58,0.9) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-10%",
            left: "-10%",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(232,197,126,0.15) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "300px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(232,197,126,0.08) 0%, transparent 70%)",
            filter: "blur(50px)",
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
              "linear-gradient(90deg, transparent, rgba(232,197,126,0.4), transparent)",
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

          {/* Center content */}
          <div>
            <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase mb-5">
              Event personalization
            </div>
            <h2 className="text-[30px] lg:text-[36px] font-bold text-white leading-tight tracking-tight">
              Your event identity,
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
                personalized.
              </span>
            </h2>
            <p className="mt-4 text-white/40 text-[14px] leading-relaxed max-w-[280px]">
              Upload your design once. Let every attendee carry a piece of it.
            </p>

            {/* Stacked mock cards */}
            <div className="mt-12 relative h-[200px]">
              {/* Card 3 — back */}
              <div
                className="absolute rounded-xl overflow-hidden"
                style={{
                  left: 24,
                  top: 16,
                  width: 148,
                  height: 196,
                  background:
                    "linear-gradient(155deg, #0a2540 0%, #1b4f72 60%, #7be0c0 130%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transform: "rotate(-7deg)",
                  opacity: 0.35,
                }}
              />
              {/* Card 2 — mid */}
              <div
                className="absolute rounded-xl overflow-hidden"
                style={{
                  left: 52,
                  top: 8,
                  width: 148,
                  height: 196,
                  background:
                    "linear-gradient(155deg, #0F2A1C 0%, #1F4D3A 55%, #E8C57E 130%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transform: "rotate(-2deg)",
                  opacity: 0.55,
                }}
              />
              {/* Card 1 — front */}
              <div
                className="absolute rounded-xl overflow-hidden"
                style={{
                  left: 80,
                  top: 0,
                  width: 148,
                  height: 196,
                  background:
                    "linear-gradient(155deg, #0F1F18 0%, #1F4D3A 55%, #E8C57E 130%)",
                  border: "1px solid rgba(232,197,126,0.25)",
                  transform: "rotate(4deg)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div className="p-4 h-full flex flex-col justify-between">
                  <span className="text-white/25 font-mono text-[7px] tracking-[0.18em]">
                    CARDLY · EVENT
                  </span>
                  <div className="flex items-center justify-center">
                    <div
                      className="rounded-full border border-white/20 bg-white/10"
                      style={{ width: 52, height: 52 }}
                    />
                  </div>
                  <div>
                    <div className="text-white font-bold text-[13px]">
                      Ifeoma A.
                    </div>
                    <div className="text-white/45 text-[10px]">
                      Brand Strategist
                    </div>
                    <div className="text-white/20 font-mono text-[7px] tracking-widest mt-1.5">
                      I&apos;M ATTENDING
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#1F4D3A" }}
            />
            <p className="text-[12px] text-white/25">
              Trusted by 1,000+ event organizers across Africa
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white relative">
        {/* Subtle dot grid on form side */}
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
            Welcome back
          </h1>
          <p className="text-[14px] text-neutral-500 mb-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#1F4D3A] font-medium hover:underline"
            >
              Sign up →
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-neutral-700">
                  Password
                </label>
                <a
                  href="#"
                  className="text-[12px] text-neutral-400 hover:text-[#1F4D3A] transition"
                >
                  Forgot password?
                </a>
              </div>
              <input
                name="password"
                type="password"
                required
                placeholder="Your password"
                className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/15 focus:border-[#1F4D3A]/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-10 text-white text-[14px] font-semibold rounded-lg disabled:opacity-50 transition"
              style={{ background: "#0F1F18" }}
            >
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-[12px] text-neutral-400">
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
