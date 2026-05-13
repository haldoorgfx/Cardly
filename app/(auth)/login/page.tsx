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
      {/* LEFT: form */}
      <div className="flex-1 flex flex-col p-8 lg:p-12 bg-white min-h-screen">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-lg grad-bg grid place-items-center text-white font-display font-bold text-[14px]">
            C
          </span>
          <span className="font-display font-bold text-[18px]">Cardly</span>
        </Link>

        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-[400px]">
            <div className="font-mono text-[11px] tracking-widest text-ink/45 mb-3">
              WELCOME BACK
            </div>
            <h1 className="font-display font-bold text-[36px] leading-tight">
              Sign in to <span className="grad-text">Cardly</span>
            </h1>
            <p className="text-[14px] text-ink/60 mt-2">
              Design once. Let attendees personalize forever.
            </p>

            {/* Tabs */}
            <div className="mt-7 inline-flex p-1 rounded-full bg-cream border border-border text-[13px]">
              <span className="px-4 h-9 rounded-full bg-white shadow-sm font-medium flex items-center">
                Sign in
              </span>
              <Link
                href="/signup"
                className="px-4 h-9 rounded-full text-ink/60 font-medium flex items-center hover:text-ink transition"
              >
                Create account
              </Link>
            </div>

            {/* Google */}
            <button
              type="button"
              className="mt-5 w-full h-12 rounded-xl border border-border bg-white flex items-center justify-center gap-3 font-medium text-[14px] hover:bg-cream transition"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] font-mono tracking-widest text-ink/40">
              <div className="flex-1 h-px bg-border" />
              OR
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Form */}
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {error && (
                <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}
              <div>
                <label className="text-[12px] font-medium text-ink/70 mb-1.5 block">
                  Work email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@studio.com"
                  className="w-full px-[14px] py-[13px] border-[1.5px] border-border rounded-xl text-[14.5px] font-medium bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(31,77,58,0.15)] transition"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-medium text-ink/70">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-[12px] text-primary font-medium hover:underline"
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  className="w-full px-[14px] py-[13px] border-[1.5px] border-border rounded-xl text-[14.5px] font-medium bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(31,77,58,0.15)] transition"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-xl grad-bg text-white font-display font-semibold text-[15px] shadow-[0_8px_20px_rgba(31,77,58,0.25)] hover:opacity-95 transition disabled:opacity-60"
              >
                {isPending ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-[13px] text-ink/55 text-center">
              New here?{" "}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div className="text-[11.5px] font-mono text-ink/40 flex items-center justify-between">
          <span>© 2026 Cardly</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-ink">
              Privacy
            </a>
            <a href="#" className="hover:text-ink">
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* RIGHT: visual */}
      <AuthVisual />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A8.99 8.99 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.32z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A8.97 8.97 0 0 0 9 0 8.99 8.99 0 0 0 .96 4.96l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function AuthVisual() {
  return (
    <div className="hidden lg:flex flex-1 grad-bg relative overflow-hidden">
      {/* ambient glow shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[10%] right-[-15%] h-[460px] w-[460px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(closest-side, #ffd28a, transparent)",
          }}
        />
        <div
          className="absolute bottom-[-15%] left-[-10%] h-[420px] w-[420px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(closest-side, #1f8a5b, transparent)",
          }}
        />
      </div>

      {/* sample card mockup */}
      <div className="relative m-auto" style={{ width: 340 }}>
        <div className="absolute -left-12 top-6 w-[280px] h-[350px] rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 -rotate-6 animate-floatB" />
        <div className="absolute -right-10 -top-4 w-[260px] h-[330px] rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 rotate-6 animate-floatA" />
        <div
          className="relative rounded-3xl shadow-2xl animate-floatA overflow-hidden aspect-[4/5]"
          style={{
            background:
              "linear-gradient(155deg,#0F1F18,#1F4D3A 40%,#2A6A50 80%,#E8C57E 130%)",
          }}
        >
          <div
            className="absolute -top-16 -right-16 h-44 w-44 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(232,197,126,0.45), transparent)",
            }}
          />
          <div
            className="absolute top-4 left-4 right-4 flex items-center justify-between text-white/80 font-mono"
            style={{ fontSize: 8, letterSpacing: "0.18em" }}
          >
            <span>AFRICA · TECH · FESTIVAL</span>
            <span>LAGOS</span>
          </div>
          <div
            className="absolute top-12 left-4 right-4 text-white font-display font-bold leading-[0.98]"
            style={{ fontSize: 32, letterSpacing: "-0.03em" }}
          >
            I&apos;m attending
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#E8C57E,#fff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Africa Tech Festival.
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
            <div
              className="h-14 w-14 rounded-full grid place-items-center text-white font-display font-bold text-[17px] shrink-0"
              style={{
                background: "linear-gradient(135deg,#1F4D3A,#E8C57E)",
              }}
            >
              AO
            </div>
            <div className="flex-1 min-w-0 text-white pb-1">
              <div className="font-display font-bold text-[16px] leading-tight truncate">
                Adaeze Okonkwo
              </div>
              <div
                className="font-mono opacity-80 truncate"
                style={{ fontSize: 9 }}
              >
                Lead Designer · Flutterwave
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* testimonial */}
      <div className="absolute bottom-12 left-12 right-12 text-white max-w-[480px]">
        <div className="text-[18px] font-display leading-snug">
          &ldquo;We onboarded 4,200 attendee cards in one weekend without
          lifting a finger. The link does the work.&rdquo;
        </div>
        <div className="mt-3 flex items-center gap-3 text-white/70 text-[12px] font-mono tracking-wide">
          <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center text-white text-[11px] font-display font-bold shrink-0">
            KM
          </div>
          <div>KWAME MENSAH · ORGANIZER · GHANA TECH WEEK</div>
        </div>
      </div>
    </div>
  );
}
