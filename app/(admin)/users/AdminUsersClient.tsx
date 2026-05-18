"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "../actions";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  role: string;
  created_at: string;
};

type Props = {
  users: UserRow[];
  actorRole: "admin" | "super_admin";
  currentUserId: string;
};

const ROLE_LABELS: Record<string, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super admin",
};

const PLAN_COLORS: Record<string, string> = {
  free: "text-[#6B7A72] bg-[#F5F5F4]",
  pro: "text-blue-600 bg-blue-50",
  studio: "text-purple-600 bg-purple-50",
};

export default function AdminUsersClient({ users, actorRole, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.role.includes(q)
    );
  });

  function handleRoleChange(userId: string, newRole: string) {
    if (userId === currentUserId) return;
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole as "user" | "admin" | "super_admin");
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccessId(userId);
        setTimeout(() => setSuccessId(null), 2000);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-[24px] text-[#0F1F18]">Users</h1>
          <p className="text-[13px] text-[#6B7A72] mt-0.5">{users.length} total accounts</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="h-9 px-3.5 rounded-lg border text-[13px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 focus:outline-none transition w-64"
          style={{ borderColor: "#E5E0D4", background: "white" }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(31,77,58,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(31,77,58,0.1)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "#E5E0D4"; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>

      {error && (
        <div className="mb-4 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E0D4" }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b" style={{ borderColor: "#E5E0D4" }}>
              <th className="text-left px-5 py-3 text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest font-normal">User</th>
              <th className="text-left px-5 py-3 text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest font-normal">Plan</th>
              <th className="text-left px-5 py-3 text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest font-normal">Role</th>
              <th className="text-left px-5 py-3 text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest font-normal">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr
                key={u.id}
                className={i < filtered.length - 1 ? "border-b" : ""}
                style={{ borderColor: "#E5E0D4" }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full grid place-items-center text-white text-[12px] font-semibold shrink-0"
                      style={{ background: "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)" }}
                    >
                      {u.full_name?.[0]?.toUpperCase() ?? u.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="font-medium text-[#0F1F18] leading-snug">
                        {u.full_name ?? "—"}
                        {u.id === currentUserId && (
                          <span className="ml-1.5 text-[10px] font-mono text-[#6B7A72]/50">(you)</span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#6B7A72]">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[u.plan] ?? PLAN_COLORS.free}`}>
                    {u.plan.charAt(0).toUpperCase() + u.plan.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {u.id === currentUserId || actorRole !== "super_admin" ? (
                    <span className="text-[13px] text-[#3A4A42]">{ROLE_LABELS[u.role] ?? u.role}</span>
                  ) : (
                    <select
                      value={u.role}
                      disabled={isPending}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="h-7 px-2 rounded-lg border text-[12px] text-[#0F1F18] focus:outline-none transition disabled:opacity-50"
                      style={{ borderColor: "#E5E0D4", background: "#FAF6EE" }}
                    >
                      {["user", "admin", "super_admin"].map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  )}
                  {successId === u.id && (
                    <span className="ml-2 text-[11px] text-emerald-600">✓ saved</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-[12px] text-[#6B7A72]">
                  {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3.5" />
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#6B7A72]">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
