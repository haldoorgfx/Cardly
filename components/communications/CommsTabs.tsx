'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Tab = 'whatsapp' | 'automations' | 'preview' | 'broadcast';

const TABS: { key: Tab; label: string; seg: string }[] = [
  { key: 'whatsapp', label: 'Connect', seg: 'whatsapp' },
  { key: 'automations', label: 'Journey', seg: 'automations' },
  { key: 'preview', label: 'Preview', seg: 'preview' },
  { key: 'broadcast', label: 'Broadcast', seg: 'broadcast' },
];

/** Shared sub-navigation for the WhatsApp/notifications communications area. */
export function CommsTabs({ eventSlug, active }: { eventSlug: string; active: Tab }) {
  return (
    <div className="mb-6">
      <Link
        href={`/events/${eventSlug}/communications`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition hover:text-[#1F4D3A]"
        style={{ color: '#6B7A72' }}
      >
        <ArrowLeft size={15} strokeWidth={2} /> Back to Communications
      </Link>
      <div className="flex gap-1 rounded-xl p-1 overflow-x-auto no-scrollbar" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/events/${eventSlug}/communications/${t.seg}`}
            className="flex-none h-8 px-3.5 rounded-lg text-[13px] font-medium transition flex items-center"
            style={{
              background: active === t.key ? '#1F4D3A' : 'transparent',
              color: active === t.key ? '#FFFFFF' : '#6B7A72',
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
