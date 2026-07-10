'use client';

import { useState } from 'react';
import { Flag, ToggleLeft, ToggleRight } from 'lucide-react';
import type { FeatureFlag } from '@/lib/flags';

interface Props {
  initialFlags: FeatureFlag[];
}

export function FlagsAdminClient({ initialFlags }: Props) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(flag: string, current: boolean) {
    setSaving(flag);
    const res = await fetch('/api/admin/flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag, enabled: !current }),
    });
    if (res.ok) {
      setFlags(prev => prev.map(f => f.flag === flag ? { ...f, enabled: !current } : f));
    }
    setSaving(null);
  }

  const enabled = flags.filter(f => f.enabled).length;

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#FAF6EE' }}>
      {/* Header */}
      <div className="px-6 pt-7 pb-6 border-b shrink-0" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B7A72]/60 mb-3">
          <span>PLATFORM</span><span>/</span><span className="text-[#6B7A72]">Feature Flags</span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight">Feature flags</h1>
            <p className="text-[13px] text-[#6B7A72] mt-1">
              {enabled} of {flags.length} flags enabled globally.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-2xl">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
          >
            {flags.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-3">
                <Flag size={28} strokeWidth={1.4} color="#C9C3B1" />
                <p className="text-[13px] text-[#6B7A72]">No flags found. Run migration 009 in Supabase.</p>
              </div>
            )}

            {flags.map((flag, i) => (
              <div
                key={flag.flag}
                className="flex items-center gap-4 px-6 py-4"
                style={{
                  borderBottom: i < flags.length - 1 ? '1px solid #E5E0D4' : 'none',
                  opacity: saving === flag.flag ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Flag icon */}
                <div
                  className="h-9 w-9 rounded-xl grid place-items-center shrink-0"
                  style={{
                    background: flag.enabled ? 'rgba(31,77,58,0.08)' : '#F5F5F0',
                  }}
                >
                  <Flag size={15} strokeWidth={1.8} color={flag.enabled ? '#1F4D3A' : '#9CA3AF'} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-[#0F1F18]">{flag.label}</span>
                    <span className=" text-[10px] text-[#6B7A72]/60">{flag.flag}</span>
                  </div>
                  {flag.description && (
                    <p className="text-[12.5px] text-[#6B7A72] mt-0.5 leading-relaxed">{flag.description}</p>
                  )}
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggle(flag.flag, flag.enabled)}
                  disabled={saving === flag.flag}
                  title={flag.enabled ? 'Disable globally' : 'Enable globally'}
                  className="shrink-0 transition-colors"
                  style={{ color: flag.enabled ? '#1F4D3A' : '#C9C3B1' }}
                >
                  {flag.enabled
                    ? <ToggleRight size={28} strokeWidth={1.8} />
                    : <ToggleLeft size={28} strokeWidth={1.8} />
                  }
                </button>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[12px] text-[#6B7A72]/60 px-1">
            Per-user overrides can be set via the API: <code className=" text-[11px]">POST /api/admin/flags/[flag]/overrides</code>
          </p>
        </div>
      </div>
    </div>
  );
}
