"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/(auth)/actions";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/settings?success=password_updated");
      }
    });
  }

  return (
    <div className="max-w-[400px]">
      <div
        className="w-full bg-white rounded-2xl px-8 py-10"
        style={{ border: "1px solid #E5E0D4", boxShadow: "0 1px 2px rgba(15,31,24,0.04)" }}
      >
        <h1 className="text-[22px] font-bold text-[#0F1F18] tracking-tight mb-1">Set new password</h1>
        <p className="text-[14px] text-[#6B7A72] mb-7">Choose a strong password for your account.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#3A4A42] mb-1.5">New password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 transition focus:outline-none"
              style={{ borderColor: "#E5E0D4", background: "#FAF6EE" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(31,77,58,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(31,77,58,0.1)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E5E0D4"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#3A4A42] mb-1.5">Confirm password</label>
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              placeholder="Same password again"
              className="w-full h-10 px-3.5 rounded-lg border text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 transition focus:outline-none"
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
            {isPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
