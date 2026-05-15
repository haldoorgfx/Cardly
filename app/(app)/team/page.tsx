import Link from 'next/link';

const FEATURES = [
  { icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', label: 'Unlimited team seats' },
  { icon: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', label: 'Role-based permissions' },
  { icon: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>', label: 'Shared brand kit' },
  { icon: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>', label: 'Collaborative editing' },
  { icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', label: 'Team analytics' },
  { icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.65a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>', label: 'Priority support' },
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
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
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: f.icon }} />
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
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M19 8v6M22 11h-6"/>
              </svg>
              <div className="text-[13px] text-[#6B7A72]">No other members yet.</div>
              <div className="text-[11.5px] text-[#6B7A72]/60">Team invites require the Studio plan.</div>
            </div>
          </div>

          {/* Coming soon note */}
          <div className="flex items-center gap-2 text-[12px] text-[#6B7A72]/60 px-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            Team roles, audit log, and SSO are coming in a future release.
          </div>

        </div>
      </div>
    </div>
  );
}
