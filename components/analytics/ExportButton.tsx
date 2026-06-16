'use client';

interface PerfEvent {
  id: string;
  name: string;
  status: string;
  regs: number;
  revenue: number;
  cards: number;
  checkedIn: number;
}

interface Props {
  events: PerfEvent[];
  currency: string | null;
  period: string;
}

export function ExportButton({ events, period }: Props) {
  function handleExport() {
    const periodLabel = period === '1y' ? 'Last Year' : period === '6m' ? 'Last 6 Months' : 'Last 90 Days';

    const headers = ['Event', 'Status', 'Registrations', 'Revenue', 'Cards Shared', 'Check-in Rate'];
    const rows = events.map(e => [
      e.name,
      e.status === 'published' ? 'Live' : 'Draft',
      String(e.regs),
      String(e.revenue),
      String(e.cards),
      e.regs > 0 ? `${Math.round((e.checkedIn / e.regs) * 100)}%` : '0%',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventera-analytics-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="h-9 flex items-center gap-1.5 px-4 rounded-xl text-[13px] font-medium transition-all hover:bg-[#F5F3EE]"
      style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Export
    </button>
  );
}
