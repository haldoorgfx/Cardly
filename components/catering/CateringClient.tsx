'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, UtensilsCrossed, Accessibility } from 'lucide-react';
import { EntitlementIcon } from '@/components/tickets/EntitlementIcon';
import { PageShell, PageHeader } from '@/components/dash';
import { StatusState } from '@/components/ui/status-state';
import { escapeCsvCell as csvCell } from '@/lib/csv';

export interface DietaryCount {
  tag: string;
  count: number;
}

export interface Meal {
  entitlement_id: string;
  entitlement_name: string;
  total_redeemed: number;
  dietary: DietaryCount[];
}

interface Props {
  eventSlug: string;
  meals: Meal[] | null;
  loadError: 'auth' | 'generic' | null;
}

/** Build a caterer-ready CSV: one row per (meal, tag), plus a total-servings row. */
function buildCsv(meals: Meal[]): string {
  const rows: string[] = ['Meal,Dietary tag,Count'];
  meals.forEach((m) => {
    if (m.dietary.length === 0) {
      rows.push([csvCell(m.entitlement_name), csvCell('No dietary tags recorded'), csvCell(0)].join(','));
    } else {
      m.dietary.forEach((d) => {
        rows.push([csvCell(m.entitlement_name), csvCell(d.tag), csvCell(d.count)].join(','));
      });
    }
    rows.push([csvCell(m.entitlement_name), csvCell('Total servings'), csvCell(m.total_redeemed)].join(','));
  });
  return rows.join('\n');
}

export function CateringClient({ eventSlug, meals, loadError }: Props) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const hasMeals = !!meals && meals.length > 0;

  function handleExport() {
    if (!meals || meals.length === 0) return;
    setExporting(true);
    try {
      const blob = new Blob([buildCsv(meals)], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catering-${eventSlug}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <PageShell width="wide">

        <Link
          href={`/events/${eventSlug}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition hover:text-[#1F4D3A]"
          style={{ color: '#65736B' }}
        >
          <ArrowLeft size={15} strokeWidth={2} /> Back to event
        </Link>

        <PageHeader
          title="Catering"
          subtitle="What to prepare, per meal. Counts come from meals actually redeemed at check-in, broken down by the dietary needs attendees shared."
          actions={hasMeals ? (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#163828] disabled:opacity-60 shrink-0"
              style={{ background: '#1F4D3A' }}
            >
              <Download size={15} strokeWidth={2} /> Export CSV
            </button>
          ) : undefined}
        />

        {/* Cross-link to accessibility */}
        <Link
          href={`/events/${eventSlug}/catering/accessibility`}
          className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 mb-6 text-[13px] font-medium transition hover:border-[#1F4D3A]"
          style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          <Accessibility size={15} strokeWidth={2} style={{ color: '#1F4D3A' }} />
          Accessibility needs
        </Link>

        {loadError ? (
          <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
            <StatusState
              kind="error"
              reason={loadError === 'auth' ? 'permission' : 'network'}
              title={loadError === 'auth' ? 'You can’t manage this event' : 'Couldn’t load catering counts'}
              message={loadError === 'auth'
                ? 'Only the event owner or its staff can see catering counts.'
                : 'We couldn’t reach the database to fetch the counts. Please try again.'}
              primaryAction={loadError === 'generic' ? { label: 'Try again', onClick: () => router.refresh() } : undefined}
            />
          </div>
        ) : !hasMeals ? (
          <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
            <StatusState
              kind="empty"
              icon={UtensilsCrossed}
              title="No meal entitlements yet"
              message="Add a meal entitlement and attach it to your ticket types. Once meals are scanned at check-in, their counts and dietary breakdown appear here."
              primaryAction={{ label: 'Set up entitlements', href: `/events/${eventSlug}/entitlements` }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {meals!.map((m) => (
              <div key={m.entitlement_id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E0D4' }}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      <EntitlementIcon type="meal" size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold truncate" style={{ color: '#0F1F18' }}>{m.entitlement_name}</div>
                      <div className="text-[12.5px]" style={{ color: '#65736B' }}>
                        {m.total_redeemed} {m.total_redeemed === 1 ? 'serving' : 'servings'} redeemed
                      </div>
                    </div>
                  </div>
                </div>

                {m.dietary.length === 0 ? (
                  <p className="text-[13px]" style={{ color: '#65736B' }}>
                    No dietary needs shared for this meal yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {m.dietary.map((d) => (
                      <div
                        key={d.tag}
                        className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
                        style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
                      >
                        <span className="text-[13.5px] font-medium" style={{ color: '#3A4A42' }}>{d.tag}</span>
                        <span className="text-[14px] font-semibold" style={{ color: '#0F1F18' }}>{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </PageShell>
  );
}
