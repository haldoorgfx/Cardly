import Link from 'next/link';
import React from 'react';
import { Users, Lock, Flag, Pencil, BarChart2, Phone, Plus, Clock } from 'lucide-react';

const FEATURES: { icon: React.ReactNode; label: string }[] = [
  { icon: <Users size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Unlimited team seats' },
  { icon: <Lock size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Role-based permissions' },
  { icon: <Flag size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Shared brand kit' },
  { icon: <Pencil size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Collaborative editing' },
  { icon: <BarChart2 size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Team analytics' },
  { icon: <Phone size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Priority support' },
];

export default function TeamPage() {
  return (
    <div className="min-h-full flex flex-col">

      {/* Page header */}
      <div
        className="relative overflow-hidden px-6 pt-7 pb-6 border-b shrink-0"
        style={{ background: 'white', borderColor: '#E5E0D4' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: '-50%', right: '-5%', width: 260, height: 260, background: 'radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#6B7A72]/60 mb-3">
            <span>WORKSPACE</span>
            <span>/</span>
            <span className="text-[#6B7A72]">Team</span>
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight">Team</h1>
              <p className="text-[13px] text-[#6B7A72] mt-1">Manage collaborators and workspace access.</p>
            </div>
            <button
              disabled
              className="inline-flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-lg cursor-not-allowed opacity-40 transition"
              style={{ background: '#1F4D3A', color: 'white' }}
            >
              <Plus size={12} strokeWidth={2.8} />
              Invite member
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-2xl flex flex-col gap-5">

          {/* Studio upsell card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
          >
            {/* Gradient top strip */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />

            <div className="p-6">
              {/* Header row */}
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="h-11 w-11 rounded-xl grid place-items-center shrink-0 text-white"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)', boxShadow: '0 4px 12px rgba(31,77,58,0.25)' }}
                >
                  <Users size={20} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="font-display font-bold text-[17px] text-[#0F1F18]">Team collaboration</h2>
                    <span
                      className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(232,197,126,0.18)', color: '#C9A45E', border: '1px solid rgba(232,197,126,0.35)' }}
                    >
                      STUDIO
                    </span>
                  </div>
                  <p className="text-[13px] text-[#6B7A72] leading-relaxed">
                    Invite team members to collaborate on events, share designs, and manage your workspace together.
                  </p>
                </div>
              </div>

              {/* Feature grid */}
              <div
                className="grid grid-cols-2 gap-3 rounded-xl p-4 mb-6"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
              >
                {FEATURES.map(f => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <div
                      className="h-6 w-6 rounded-md grid place-items-center shrink-0"
                      style={{ background: 'rgba(31,77,58,0.08)' }}
                    >
                      {f.icon}
                    </div>
                    <span className="text-[12.5px] text-[#3A4A42]">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA row */}
              <div className="flex items-center gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 h-9 px-5 text-[13px] font-semibold text-white rounded-lg hover:opacity-90 transition"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A, #E8C57E)' }}
                >
                  Upgrade to Studio →
                </Link>
                <span className="text-[12px] text-[#6B7A72]">From $49/mo · cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Members card */}
          <div
            className="rounded-2xl"
            style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: '#E5E0D4' }}
            >
              <div>
                <div className="text-[10.5px] font-mono tracking-widest text-[#6B7A72]/60 uppercase mb-0.5">Members</div>
                <div className="text-[13.5px] font-semibold text-[#0F1F18]">1 member</div>
              </div>
              <button
                disabled
                className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium rounded-lg border cursor-not-allowed opacity-40"
                style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                <Plus size={10} strokeWidth={2.5} />
                Invite
              </button>
            </div>

            {/* Member row */}
            <div className="px-6 py-4 flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full grid place-items-center text-white text-[12px] font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
              >
                A
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-[#0F1F18]">You</div>
                <div className="text-[12px] text-[#6B7A72]">cabdalla005@gmail.com</div>
              </div>
              <span
                className="text-[10.5px] font-mono px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A', border: '1px solid rgba(31,77,58,0.15)' }}
              >
                Owner
              </span>
            </div>

            {/* Empty invite area */}
            <div
              className="mx-6 mb-6 rounded-xl border border-dashed flex flex-col items-center justify-center py-8 gap-2"
              style={{ borderColor: 'rgba(31,77,58,0.2)', background: 'rgba(31,77,58,0.02)' }}
            >
              <Users size={20} strokeWidth={1.6} color="#1F4D3A" style={{ opacity: 0.45 }} />
              <div className="text-[13px] text-[#6B7A72]">No other members yet.</div>
              <div className="text-[11.5px] text-[#6B7A72]/60">Team invites require the Studio plan.</div>
            </div>
          </div>

          {/* Coming soon note */}
          <div className="flex items-center gap-2 text-[12px] text-[#6B7A72]/60 px-1">
            <Clock size={12} strokeWidth={2} />
            Team roles, audit log, and SSO are coming in a future release.
          </div>

        </div>
      </div>
    </div>
  );
}
