'use client';

import { useState } from 'react';
import { escapeCsvCell } from '@/lib/csv';

interface PerfEvent {
  id: string;
  name: string;
  status: string;
  regs: number;
  revenue: number;
  /** This event's own billing currency; null when it earned nothing (or, rarely, sold in two). */
  currency: string | null;
  cards: number;
  checkedIn: number;
}

interface Props {
  events: PerfEvent[];
  currency: string | null;
  period: string;
}

export function ExportButton({ events, currency, period }: Props) {
  const [exported, setExported] = useState(false);
  const disabled = events.length === 0;

  function handleExport() {
    if (disabled) return;
    const periodLabel = period === '1y' ? 'Last Year' : period === '6m' ? 'Last 6 Months' : 'Last 90 Days';

    // Revenue is exported alongside its OWN currency code, one column each, so a
    // spreadsheet never invites the reader to sum a DJF row and a USD row. The
    // page-level `currency` prop is only a hint that the portfolio is uniform;
    // the per-row code is the authoritative unit.
    const headers = ['Event', 'Status', 'Registrations', 'Revenue', 'Currency', 'Cards Shared', 'Check-in Rate'];
    const rows = events.map(e => [
      e.name,
      e.status === 'published' ? 'Live' : 'Draft',
      String(e.regs),
      String(e.revenue),
      e.currency ?? currency ?? '',
      String(e.cards),
      e.regs > 0 ? `${Math.round((e.checkedIn / e.regs) * 100)}%` : '0%',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(escapeCsvCell).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventera-analytics-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled}
      title={disabled ? 'No event data to export yet' : 'Download analytics as CSV'}
      className="h-9 flex items-center gap-1.5 px-4 rounded-xl text-[13px] font-medium transition-all hover:bg-[#F5F3EE] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: 'white', border: '1px solid #E5E0D4', color: exported ? '#2D7A4F' : '#3A4A42' }}
    >
      {exported ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      )}
      {exported ? 'Exported' : 'Export'}
    </button>
  );
}
