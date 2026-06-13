'use client';

import { useRouter } from 'next/navigation';
import type { Variant } from '@/types/database';
import { ArrowRight } from 'lucide-react';

interface Props {
  eventName: string;
  eventSlug: string;
  variants: Variant[];
}

export default function VariantPickerClient({ eventName, eventSlug, variants }: Props) {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #070f0b 0%, #0F1F18 55%, #0a1810 100%)' }}
    >
      <div className="w-full max-w-[375px]">
        <div className="text-center mb-10">
          <div className="text-[11px] tracking-widest text-white/40 mb-2">GET YOUR CARD</div>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight mb-2">{eventName}</h1>
          <p className="text-white/50 text-[14px]">I am attending as…</p>
        </div>

        <div className="space-y-3">
          {variants.map(v => (
            <button
              key={v.id}
              onClick={() => router.push(`/c/${eventSlug}/${v.variant_slug}`)}
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
              <ArrowRight
                className="text-white/30 group-hover:text-white/60 transition shrink-0"
                size={18} strokeWidth={2}
              />
            </button>
          ))}
        </div>

        <div className="mt-10 text-center text-[11px] text-white/20">
          Powered by{' '}
          <span
            style={{
              background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Karta
          </span>
        </div>
      </div>
    </div>
  );
}
