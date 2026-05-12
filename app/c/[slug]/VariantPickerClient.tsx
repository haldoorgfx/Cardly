'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { Variant } from '@/types/database';

interface Props {
  eventName: string;
  variants: Variant[];
}

export default function VariantPickerClient({ eventName, variants }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(160deg,#0a0915 0%,#1b1240 60%,#3a1060 100%)' }}>
      <div className="w-full max-w-[375px]">
        <div className="text-center mb-10">
          <div className="text-[11px] font-mono tracking-widest text-white/40 mb-2">GET YOUR CARD</div>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight mb-2">{eventName}</h1>
          <p className="text-white/50 text-[14px]">I am attending as…</p>
        </div>

        <div className="space-y-3">
          {variants.map(v => (
            <button
              key={v.id}
              onClick={() => router.push(`${pathname}/${v.variant_slug}`)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition text-left group"
            >
              {v.background_url && (
                <div
                  className="h-14 w-14 rounded-xl shrink-0 bg-cover bg-center border border-white/10"
                  style={{ backgroundImage: `url(${v.background_url})` }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-white text-[16px]">{v.variant_name}</div>
                <div className="text-[12px] text-white/40 mt-0.5">Tap to personalise your card</div>
              </div>
              <svg className="text-white/30 group-hover:text-white/60 transition shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center text-[11px] font-mono text-white/20">
          Powered by <span style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Cardly</span>
        </div>
      </div>
    </div>
  );
}
