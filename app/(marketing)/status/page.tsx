import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

export const metadata = {
  title: 'System Status',
  description: 'Live status for all Eventera services.',
};

const SERVICES = [
  { name: 'API',               desc: 'Core API — events, cards, auth',   status: 'operational' as const },
  { name: 'Card generator',    desc: 'PNG rendering & download',          status: 'operational' as const },
  { name: 'Editor',            desc: 'Canvas editor & zone saving',       status: 'operational' as const },
  { name: 'File storage',      desc: 'Uploads, backgrounds, outputs',     status: 'operational' as const },
  { name: 'Attendee pages',    desc: 'Public /c/[slug] routes',           status: 'operational' as const },
  { name: 'Auth',              desc: 'Login, signup, session management', status: 'operational' as const },
  { name: 'Email delivery',    desc: 'Transactional emails',              status: 'operational' as const },
  { name: 'Dashboard',         desc: 'Designer app & analytics',          status: 'operational' as const },
];

const UPTIME = [
  { label: 'API',            value: 'Operational', period: 'Live' },
  { label: 'Card generator', value: 'Operational', period: 'Live' },
  { label: 'Storage',        value: 'Operational', period: 'Live' },
];

const INCIDENTS: { date: string; title: string; body: string; resolved: boolean }[] = [];

type StatusType = 'operational' | 'degraded' | 'outage';

function StatusBadge({ status }: { status: StatusType }) {
  if (status === 'operational') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[0.12em] uppercase"
        style={{ background: 'rgba(45,122,79,0.10)', color: '#2D7A4F' }}>
        <CheckCircle2 size={12} strokeWidth={2.5} /> Operational
      </span>
    );
  }
  if (status === 'degraded') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[0.12em] uppercase"
        style={{ background: 'rgba(201,122,45,0.10)', color: '#C97A2D' }}>
        <AlertCircle size={12} strokeWidth={2.5} /> Degraded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[0.12em] uppercase"
      style={{ background: 'rgba(184,66,60,0.10)', color: '#B8423C' }}>
      <AlertCircle size={12} strokeWidth={2.5} /> Outage
    </span>
  );
}

/* ── Hero / overall status ───────────────────────────────── */
function StatusHero() {
  const allGood = SERVICES.every(s => s.status === 'operational');

  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ borderColor: '#E5E0D4' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,31,24,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-14 lg:pt-20 pb-14 lg:pb-20">
        <div className=" text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
          System Status
        </div>

        {/* Big status banner */}
        <div
          className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 mb-8"
          style={
            allGood
              ? { background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.20)' }
              : { background: 'rgba(201,122,45,0.08)', border: '1px solid rgba(201,122,45,0.20)' }
          }
        >
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{
              background: allGood ? '#2D7A4F' : '#C97A2D',
              boxShadow: allGood
                ? '0 0 0 4px rgba(45,122,79,0.18)'
                : '0 0 0 4px rgba(201,122,45,0.18)',
            }}
          />
          <span
            className="font-display font-semibold text-[18px] tracking-tight"
            style={{ color: allGood ? '#2D7A4F' : '#C97A2D' }}
          >
            {allGood ? 'All systems operational' : 'Some services degraded'}
          </span>
        </div>

        <h1 className="font-title font-bold text-ink text-[42px] sm:text-[56px] lg:text-[64px] leading-[0.95] max-w-[700px]">
          {allGood ? 'Everything is running.' : 'We\'re investigating an issue.'}
        </h1>
        <p className="mt-5 text-ink-soft text-[16px] leading-[1.55] max-w-[520px]">
          Current status of the Eventera platform. If you&apos;re seeing a problem that isn&apos;t reflected here, contact support.
        </p>

        {/* Uptime strip */}
        <Reveal>
          <div
            className="mt-10 grid grid-cols-3 rounded-2xl overflow-hidden max-w-[480px]"
            style={{ gap: '1px', background: '#E5E0D4', border: '1px solid #E5E0D4' }}
          >
            {UPTIME.map(({ label, value, period }) => (
              <div key={label} className="bg-cream p-5">
                <div className="font-display font-bold text-primary text-[15px] lg:text-[17px] tracking-[-0.02em] leading-none">
                  {value}
                </div>
                <div className="mt-1.5  text-[9px] tracking-[0.16em] uppercase text-muted">
                  {label}
                </div>
                <div className="mt-0.5  text-[9px] tracking-[0.12em] uppercase" style={{ color: 'rgba(107,122,114,0.6)' }}>
                  {period}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Services grid ───────────────────────────────────────── */
function ServicesList() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20">
      <Reveal>
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className=" text-[11px] tracking-[0.22em] text-primary uppercase mb-2">Components</div>
            <h2 className="font-title font-bold text-ink text-[28px] sm:text-[34px]">
              Service status
            </h2>
          </div>
          <div className=" text-[10px] tracking-[0.16em] uppercase text-muted">
            Manually updated
          </div>
        </div>
      </Reveal>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #E5E0D4' }}
      >
        {SERVICES.map((svc, i) => (
          <Reveal key={svc.name} delay={i * 50} distance={12}>
            <div
              className="flex items-center justify-between px-6 py-4 bg-surface hover:bg-cream transition-colors"
              style={i < SERVICES.length - 1 ? { borderBottom: '1px solid #E5E0D4' } : {}}
            >
              <div>
                <div className="font-medium text-ink text-[14px] lg:text-[15px]">{svc.name}</div>
                <div className=" text-[10px] tracking-[0.10em] text-muted mt-0.5">{svc.desc}</div>
              </div>
              <StatusBadge status={svc.status} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Incidents ───────────────────────────────────────────── */
function Incidents() {
  return (
    <section style={{ borderTop: '1px solid #E5E0D4' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20">
        <Reveal>
          <div className="mb-8">
            <div className=" text-[11px] tracking-[0.22em] text-primary uppercase mb-2">History</div>
            <h2 className="font-title font-bold text-ink text-[28px] sm:text-[34px]">
              Recent incidents
            </h2>
          </div>
        </Reveal>

        {INCIDENTS.length === 0 ? (
          <Reveal>
            <div
              className="rounded-2xl px-8 py-12 text-center"
              style={{ border: '1px solid #E5E0D4', background: 'rgba(250,246,238,0.5)' }}
            >
              <CheckCircle2 size={32} strokeWidth={1.5} className="mx-auto mb-4 text-primary" />
              <div className="font-display font-semibold text-ink text-[18px] tracking-tight mb-2">
                No incidents reported
              </div>
              <div className="text-ink-soft text-[14px]">
                We keep a public record of every incident here, with timelines and root causes.
              </div>
            </div>
          </Reveal>
        ) : (
          <div className="space-y-4">
            {INCIDENTS.map((inc, i) => (
              <Reveal key={i} delay={i * 60}>
                <article
                  className="rounded-2xl p-6 lg:p-7 bg-surface"
                  style={{ border: '1px solid #E5E0D4' }}
                >
                  <div className="flex items-start gap-4">
                    <Clock size={18} strokeWidth={1.8} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-display font-semibold text-ink text-[16px]">{inc.title}</span>
                        {inc.resolved && (
                          <span
                            className=" text-[9px] tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(45,122,79,0.10)', color: '#2D7A4F' }}
                          >
                            Resolved
                          </span>
                        )}
                      </div>
                      <div className=" text-[10px] tracking-[0.14em] uppercase text-muted mb-3">{inc.date}</div>
                      <p className="text-ink-soft text-[14px] leading-[1.6]">{inc.body}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function StatusPage() {
  return (
    <>
      <StatusHero />
      <ServicesList />
      <Incidents />
    </>
  );
}
