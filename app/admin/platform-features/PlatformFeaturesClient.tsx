'use client';

import { useState } from 'react';
import { Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import { PLATFORM_FEATURE_GROUPS, type PlatformFeatureFlagRow, type PlatformFeatureKey } from '@/lib/features/platform';

interface Props {
  initialFlags: PlatformFeatureFlagRow[];
}

export function PlatformFeaturesClient({ initialFlags }: Props) {
  const [flags, setFlags] = useState<PlatformFeatureFlagRow[]>(initialFlags);
  const [saving, setSaving] = useState<PlatformFeatureKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byKey = new Map(flags.map((f) => [f.key, f]));

  async function toggle(key: PlatformFeatureKey, current: boolean) {
    setSaving(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/platform-features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: !current }),
      });
      if (res.ok) {
        setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !current } : f));
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Failed to update this feature.');
      }
    } catch {
      setError('Failed to update this feature.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {error && (
        <p className="text-[13px] px-4 py-2.5 rounded-lg" style={{ background: '#FEF2F2', color: '#B8423C' }}>{error}</p>
      )}

      {PLATFORM_FEATURE_GROUPS.map((group) => (
        <div key={group.title}>
          <h3 className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-2 px-1" style={{ color: '#65736B' }}>
            {group.title}
          </h3>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
          >
            {group.keys.map((key, i) => {
              const flag = byKey.get(key);
              if (!flag) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-4 px-6 py-4"
                  style={{
                    borderBottom: i < group.keys.length - 1 ? '1px solid #E5E0D4' : 'none',
                    opacity: saving === key ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div
                    className="h-9 w-9 rounded-xl grid place-items-center shrink-0"
                    style={{ background: flag.enabled ? 'rgba(31,77,58,0.08)' : 'rgba(107,122,114,0.10)' }}
                  >
                    <Layers size={15} strokeWidth={1.8} color={flag.enabled ? '#1F4D3A' : '#65736B'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[13.5px] font-semibold" style={{ color: '#0F1F18' }}>{flag.label}</span>
                    {flag.description && (
                      <p className="text-[12.5px] mt-0.5 leading-relaxed" style={{ color: '#65736B' }}>{flag.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => toggle(key, flag.enabled)}
                    disabled={saving === key}
                    title={flag.enabled ? 'Disable platform-wide' : 'Enable platform-wide'}
                    className="shrink-0 transition-colors"
                    style={{ color: flag.enabled ? '#1F4D3A' : '#C9C3B1' }}
                  >
                    {flag.enabled
                      ? <ToggleRight size={28} strokeWidth={1.8} />
                      : <ToggleLeft size={28} strokeWidth={1.8} />
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
