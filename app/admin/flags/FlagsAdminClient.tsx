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

  return (
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
                    background: flag.enabled ? 'rgba(31,77,58,0.08)' : 'rgba(107,122,114,0.10)',
                  }}
                >
                  <Flag size={15} strokeWidth={1.8} color={flag.enabled ? '#1F4D3A' : '#6B7A72'} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-semibold text-[#0F1F18]">{flag.label}</span>
                    <span className="text-[12px] text-[#6B7A72]/60 break-all">{flag.flag}</span>
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
        Per-user overrides can be set via the API: <code className="font-sans text-[12.5px]">POST /api/admin/flags/[flag]/overrides</code>
      </p>
    </div>
  );
}
