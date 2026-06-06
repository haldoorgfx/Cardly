'use client';

interface Stats {
  leads: number;
  resources: number;
  hot: number;
  warm: number;
  cold: number;
}

interface Props {
  sponsorId: string;
  token: string;
  stats: Stats;
  boothNumber: string | null;
  eventName: string;
}

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={
        accent
          ? { background: 'linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))', borderColor: 'rgba(232,197,126,0.5)' }
          : { background: '#FFFFFF', borderColor: '#E5E0D4' }
      }
    >
      <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>{label}</div>
      <div className="font-mono text-[26px] tracking-tight leading-none" style={{ color: '#1F4D3A' }}>{value}</div>
      {sub && <div className="font-mono text-[11px] mt-2" style={{ color: '#2D7A4F' }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, children, pad = 'p-5' }: { title?: string; children: React.ReactNode; pad?: string }) {
  return (
    <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
          <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>{title}</div>
        </div>
      )}
      <div className={pad}>{children}</div>
    </div>
  );
}

const QUALITY_BARS = [
  { label: 'Hot · ready to buy', color: '#1F4D3A' },
  { label: 'Warm · interested',  color: '#2A6A50' },
  { label: 'Cold · browsing',    color: '#A8C2B5' },
];

export function OverviewTab({ stats, boothNumber }: Props) {
  const total = stats.leads || 1;
  const bars = [
    { ...QUALITY_BARS[0], count: stats.hot },
    { ...QUALITY_BARS[1], count: stats.warm },
    { ...QUALITY_BARS[2], count: stats.cold },
  ];

  return (
    <>
      {/* Scan CTA */}
      <div
        className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(232,197,126,0.18), rgba(31,77,58,0.06))' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-xl grid place-items-center shrink-0 text-[#C9A45E]"
            style={{ background: 'rgba(232,197,126,0.25)' }}
          >
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </span>
          <div>
            <div className="font-display text-[15px] font-semibold" style={{ color: '#163828' }}>Capture leads at your booth</div>
            <div className="text-[13px] mt-0.5" style={{ color: '#3A4A42' }}>Scan an attendee&apos;s badge or Karta Card to save them instantly.</div>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition-colors" style={{ background: '#E8C57E', color: '#163828' }}>
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
          </svg>
          Scan a lead
        </button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Leads captured" value={stats.leads} />
        <Stat label="Booth visits"   value="—" />
        <Stat label="Resources opened" value={stats.resources} />
        <Stat label="Meetings booked" value="—" accent />
      </div>

      {/* Lead quality + sessions */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Lead quality">
          <div className="grid gap-3">
            {bars.map((bar, i) => {
              const pct = Math.round((bar.count / total) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5 text-[13px]">
                    <span style={{ color: '#3A4A42' }}>{bar.label}</span>
                    <span className="font-mono" style={{ color: '#6B7A72' }}>{bar.count} · {pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(232,239,235,0.6)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bar.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Your sessions">
          <div className="grid gap-2.5">
            {boothNumber
              ? (
                <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 border" style={{ background: 'rgba(250,246,238,0.6)', borderColor: '#E5E0D4' }}>
                  <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Product demo at booth</div>
                    <div className="font-mono text-[10.5px] mt-0.5" style={{ color: '#6B7A72' }}>Booth {boothNumber}</div>
                  </div>
                </div>
              )
              : (
                <p className="text-[13px] py-3" style={{ color: '#6B7A72' }}>No sessions scheduled yet.</p>
              )
            }
          </div>
        </Panel>
      </div>
    </>
  );
}
