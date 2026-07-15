import Link from 'next/link';
import { Check, ArrowRight, Rocket, PartyPopper } from 'lucide-react';

export interface ChecklistItem {
  label: string;
  done: boolean;
  href: string;
  cta: string;
  /** Optional — purely informational, not counted toward completion. */
  optional?: boolean;
}

interface Props {
  items: ChecklistItem[];
  status: string;
  publishHref: string;
}

/**
 * Persistent "Event setup" status card for the event overview — an
 * at-a-glance completion ring + checklist, inspired by Eventee's dashboard.
 * Server-rendered (no client state).
 */
export function EventCompletionCard({ items, status, publishHref }: Props) {
  const required = items.filter(i => !i.optional);
  const doneCount = required.filter(i => i.done).length;
  const pct = required.length ? Math.round((doneCount / required.length) * 100) : 0;
  const allDone = doneCount === required.length;
  const isLive = status === 'published';

  // Progress ring geometry
  const R = 26, C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex flex-col sm:flex-row">
        {/* Left: ring + headline */}
        <div className="flex items-center gap-4 px-5 py-5 sm:w-[300px] shrink-0" style={{ background: 'linear-gradient(135deg, rgba(31,77,58,0.05), rgba(232,197,126,0.08))' }}>
          <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
            <svg aria-hidden="true" width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
              <circle cx="32" cy="32" r={R} fill="none" stroke="#E5E0D4" strokeWidth="5" />
              <circle cx="32" cy="32" r={R} fill="none" stroke={allDone ? '#2D7A4F' : '#1F4D3A'} strokeWidth="5"
                strokeLinecap="round" strokeDasharray={`${dash} ${C}`} />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-display text-[16px] font-bold" style={{ color: '#0F1F18' }}>
              {pct}%
            </span>
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
              {isLive && allDone ? 'Your event is live' : allDone ? 'Ready to publish' : 'Finish setting up'}
            </div>
            <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>
              {isLive && allDone
                ? 'Everything is in place — registrations are open.'
                : `${doneCount} of ${required.length} steps done`}
            </p>
          </div>
        </div>

        {/* Right: checklist */}
        <div className="flex-1 px-3 py-2 sm:py-2.5 sm:border-l" style={{ borderColor: '#E5E0D4' }}>
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-2 py-2 rounded-lg">
              <span className="w-5 h-5 rounded-full grid place-items-center shrink-0"
                style={item.done
                  ? { background: '#2D7A4F' }
                  : { background: 'white', border: '1.5px solid #C9C3B1' }}>
                {item.done && <Check size={12} strokeWidth={3} color="white" />}
              </span>
              <span className="flex-1 text-[13.5px]" style={{ color: item.done ? '#6B7A72' : '#0F1F18', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.label}
                {item.optional && <span className="ml-1.5 text-[12.5px]" style={{ color: '#9BA8A1' }}>optional</span>}
              </span>
              {!item.done && (
                <Link href={item.href}
                  className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md transition hover:bg-[#E8EFEB] shrink-0"
                  style={{ color: '#1F4D3A' }}>
                  {item.cta} <ArrowRight size={12} strokeWidth={2} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      {!isLive && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
          <span className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: '#6B7A72' }}>
            <Rocket size={13} strokeWidth={2} style={{ color: '#C9A45E' }} />
            {allDone ? 'All set — open registration when you are ready.' : 'Publish anytime — you can keep editing after.'}
          </span>
          <Link href={publishHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold shrink-0 transition"
            style={{ background: '#E8C57E', color: '#0F1F18' }}>
            Publish event <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>
      )}
      {isLive && allDone && (
        <div className="flex items-center gap-2 px-5 py-3 border-t" style={{ borderColor: '#E5E0D4', background: 'rgba(45,122,79,0.06)' }}>
          <PartyPopper size={14} strokeWidth={2} style={{ color: '#2D7A4F' }} />
          <span className="text-[12.5px] font-medium" style={{ color: '#1A5C38' }}>
            Your event is live and healthy.
          </span>
        </div>
      )}
    </div>
  );
}
