'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw, Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EntitlementIcon, entitlementTypeLabel } from '@/components/tickets/EntitlementIcon';
import type { RedemptionStatRow, RedemptionLimit } from '@/lib/entitlements/redemptionStats';
import { PageShell, PageHeader } from '@/components/dash';

const LIMIT_LABEL: Record<RedemptionLimit, string> = {
  once: 'Once',
  once_per_day: 'Once per day',
  unlimited: 'Unlimited',
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface Props {
  eventId: string;
  eventName: string;
  rows: RedemptionStatRow[] | null;
  error: boolean;
}

export function RedemptionDashboard({ eventId, eventName, rows, error }: Props) {
  const router = useRouter();
  const [data, setData] = useState<RedemptionStatRow[]>(rows ?? []);
  const [connected, setConnected] = useState(false);
  // re-render "x ago" labels every 30s without refetching
  const [, setTick] = useState(0);

  useEffect(() => { setData(rows ?? []); }, [rows]);

  const supabase = useMemo(() => createClient(), []);

  const applyEvent = useCallback((row: {
    entitlement_id: string;
    action: string;
    status: string;
    registration_id: string | null;
    redeemed_at: string;
  }, name: string | null) => {
    setData((prev) => prev.map((r) => {
      if (r.id !== row.entitlement_id) return r;
      if (row.action === 'redeemed' && row.status === 'redeemed') {
        return {
          ...r,
          redeemed: r.redeemed + 1,
          holders: Math.max(r.holders, r.redeemed + 1),
          last: { name: name ?? 'Attendee', at: row.redeemed_at },
        };
      }
      if (row.action === 'un_redeemed') {
        return { ...r, redeemed: Math.max(0, r.redeemed - 1) };
      }
      if (row.action === 'granted') {
        return { ...r, holders: r.holders + 1 };
      }
      if (row.action === 'revoked' || row.action === 'transferred') {
        return { ...r, holders: Math.max(r.redeemed, r.holders - 1) };
      }
      return r;
    }));
  }, []);

  // Live subscription — degrades gracefully: if the channel never connects, the
  // server-rendered counts still show. Only subscribe when there's something to track.
  useEffect(() => {
    if (error || (rows ?? []).length === 0) return;
    const channel = supabase
      .channel(`redemption:${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'entitlement_redemptions', filter: `event_id=eq.${eventId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          const row = payload.new as {
            entitlement_id: string; action: string; status: string;
            registration_id: string | null; redeemed_at: string;
          };
          let name: string | null = null;
          if (row.action === 'redeemed' && row.status === 'redeemed' && row.registration_id) {
            try {
              const { data: reg } = await supabase
                .from('registrations')
                .select('attendee_name')
                .eq('id', row.registration_id)
                .maybeSingle();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              name = (reg as any)?.attendee_name ?? null;
            } catch { /* name is optional — fall back below */ }
          }
          applyEvent(row, name);
        },
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [eventId, error, rows, supabase, applyEvent]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <PageShell width="wide">
      <PageHeader
        title="Live redemption"
        subtitle={`Real-time entitlement redemptions for ${eventName}.`}
        actions={
          !error && (rows ?? []).length > 0 ? (
            <div
              className="flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium"
              style={{
                background: connected ? '#E8EFEB' : '#FAF6EE',
                color: connected ? '#1F4D3A' : '#6B7A72',
                border: `1px solid ${connected ? '#1F4D3A22' : '#E5E0D4'}`,
              }}
              title={connected ? 'Connected — updating live' : 'Not connected — showing latest snapshot'}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${connected ? 'animate-pulse' : ''}`}
                style={{ background: connected ? '#2D7A4F' : '#6B7A72' }}
              />
              {connected ? 'Live' : 'Offline'}
            </div>
          ) : undefined
        }
      />

      {error ? (
          <div className="bg-white rounded-2xl border border-[#E5E0D4] p-10 text-center">
            <p className="font-display text-[17px] font-semibold" style={{ color: '#0F1F18' }}>Couldn&apos;t load redemptions</p>
            <p className="text-[14px] mt-1.5 mb-5" style={{ color: '#6B7A72' }}>
              Something went wrong fetching the redemption data.
            </p>
            <button
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-medium text-white"
              style={{ background: '#1F4D3A' }}
            >
              <RotateCw size={15} strokeWidth={2} /> Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E0D4] p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Radio size={22} strokeWidth={1.9} />
            </div>
            <p className="font-display text-[17px] font-semibold" style={{ color: '#0F1F18' }}>No redemptions yet</p>
            <p className="text-[14px] mt-1.5" style={{ color: '#6B7A72' }}>
              Redemptions appear here live as attendees scan in. Add entitlements to your ticket types to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((r) => {
              const pct = r.holders > 0 ? Math.min(100, Math.round((r.redeemed / r.holders) * 100)) : 0;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-[#E5E0D4] p-5">
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      <EntitlementIcon type={r.type} size={19} strokeWidth={1.9} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-[16px] leading-tight truncate" style={{ color: '#0F1F18' }}>{r.name}</p>
                      <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>
                        {entitlementTypeLabel(r.type)} · {LIMIT_LABEL[r.redemptionLimit]}
                        {r.quantity != null ? ` · Cap ${r.quantity.toLocaleString()}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display font-semibold text-[20px] leading-none" style={{ color: '#0F1F18' }}>
                        {r.redeemed.toLocaleString()}
                      </span>
                      <span className="text-[13px]" style={{ color: '#6B7A72' }}> / {r.holders.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: '#1F4D3A' }}
                    />
                  </div>

                  <p className="text-[12.5px] mt-3" style={{ color: '#6B7A72' }}>
                    {r.last
                      ? <>Last: <span style={{ color: '#3A4A42', fontWeight: 500 }}>{r.last.name}</span> · {timeAgo(r.last.at)}</>
                      : 'No redemptions yet'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
    </PageShell>
  );
}
