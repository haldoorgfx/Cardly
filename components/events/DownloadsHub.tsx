'use client';

import { Users, CalendarDays, TrendingUp, IdCard, FileSpreadsheet, FileDown } from 'lucide-react';
import Link from 'next/link';

interface Reg {
  id: string;
  attendee_name: string | null;
  status: string;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
  ticket_type_id: string | null;
}

interface SessionSpeaker {
  speakers: { name: string } | null;
}

interface SessionItem {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  session_type: string;
  room: string | null;
  track_id: string | null;
  session_speakers?: SessionSpeaker[];
}

interface TicketType {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
}

interface Track {
  id: string;
  name: string;
}

interface Props {
  eventId: string;
  eventName: string;
  regs: Reg[];
  sessions: SessionItem[];
  ticketTypes: TicketType[];
  tracks: Track[];
}

function downloadBlob(content: string, filename: string, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCsvRow(row: string[]) {
  return row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface DownloadCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions: React.ReactNode;
}

function DownloadCard({ icon, title, description, actions }: DownloadCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0" style={{ background: '#E8EFEB' }}>
          <span style={{ color: '#1F4D3A' }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-[15px] font-semibold leading-tight mb-1" style={{ color: '#0F1F18' }}>{title}</div>
          <div className="text-[13px] leading-snug" style={{ color: '#6B7A72' }}>{description}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

function PillBtn({ onClick, children, variant = 'green' }: { onClick?: () => void; children: React.ReactNode; variant?: 'green' | 'grey' | 'solid' }) {
  const styles =
    variant === 'solid'
      ? { background: '#1F4D3A', color: 'white', border: '1px solid #1F4D3A' }
      : variant === 'green'
      ? { background: 'white', color: '#1F4D3A', border: '1px solid #1F4D3A' }
      : { background: 'white', color: '#3A4A42', border: '1px solid #E5E0D4' };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition hover:opacity-80"
      style={styles}
    >
      {children}
    </button>
  );
}

export function DownloadsHub({ eventId, eventName, regs, sessions, ticketTypes, tracks }: Props) {
  const slug = slugify(eventName);

  // ── Attendee Roster ──────────────────────────────────────────────────────────

  function downloadRosterCSV() {
    const headers = ['Name', 'Ticket Type', 'Amount', 'Status', 'Registered At'];
    const rows = regs.map(r => [
      r.attendee_name ?? '',
      ticketTypes.find(t => t.id === r.ticket_type_id)?.name ?? '',
      r.amount_paid != null ? String(r.amount_paid) : '0',
      r.status === 'checked_in' ? 'Checked In' : r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, ' '),
      new Date(r.created_at).toLocaleString(),
    ]);
    const csv = [toCsvRow(headers), ...rows.map(toCsvRow)].join('\n');
    downloadBlob(csv, `karta-roster-${slug}.csv`);
  }

  // ── Agenda ───────────────────────────────────────────────────────────────────

  function downloadAgendaCSV() {
    const trackMap = new Map(tracks.map(t => [t.id, t.name]));
    const headers = ['Day', 'Start Time', 'End Time', 'Title', 'Type', 'Track', 'Room', 'Speakers'];
    const rows = sessions.map(s => [
      s.starts_at ? fmtDay(s.starts_at) : '',
      s.starts_at ? fmtTime(s.starts_at) : '',
      s.ends_at ? fmtTime(s.ends_at) : '',
      s.title,
      s.session_type,
      s.track_id ? (trackMap.get(s.track_id) ?? '') : '',
      s.room ?? '',
      (s.session_speakers ?? []).map(ss => ss.speakers?.name ?? '').filter(Boolean).join('; '),
    ]);
    const csv = [toCsvRow(headers), ...rows.map(toCsvRow)].join('\n');
    downloadBlob(csv, `karta-agenda-${slug}.csv`);
  }

  // ── Revenue ──────────────────────────────────────────────────────────────────

  function downloadRevenueCSV() {
    const confirmedRegs = regs.filter(r => ['confirmed', 'checked_in'].includes(r.status));
    const totalRevenue = confirmedRegs.reduce((s, r) => s + (r.amount_paid ?? 0), 0);

    const headers = ['Ticket Type', 'Price', 'Sold', 'Revenue'];
    const rows = ticketTypes.map(tt => {
      const sold = confirmedRegs.filter(r => r.ticket_type_id === tt.id).length;
      const rev = confirmedRegs.filter(r => r.ticket_type_id === tt.id).reduce((s, r) => s + (r.amount_paid ?? 0), 0);
      return [tt.name, tt.price != null ? String(tt.price) : 'Free', String(sold), String(rev)];
    });
    const totalRow = ['TOTAL', '', String(confirmedRegs.length), String(totalRevenue)];
    const csv = [toCsvRow(headers), ...rows.map(toCsvRow), toCsvRow(totalRow)].join('\n');
    downloadBlob(csv, `karta-revenue-${slug}.csv`);
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-semibold text-[26px] tracking-[-0.02em] mb-1" style={{ color: '#0F1F18' }}>
          Downloads
        </h1>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>{eventName}</p>
      </div>

      {/* Cards grid */}
      <div className="grid gap-5 md:grid-cols-2">

        {/* 1. Attendee Roster */}
        <DownloadCard
          icon={<Users size={18} strokeWidth={1.7} />}
          title="Attendee Roster"
          description="Full list of registered attendees — opens directly in Excel or Google Sheets"
          actions={
            <>
              <PillBtn onClick={downloadRosterCSV} variant="green">
                <FileSpreadsheet size={13} strokeWidth={2} /> Spreadsheet
              </PillBtn>
              <a
                href={`/api/events/${eventId}/roster/pdf`}
                download={`karta-roster-${slug}.pdf`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition hover:opacity-80"
                style={{ background: 'white', color: '#3A4A42', border: '1px solid #E5E0D4' }}
              >
                <FileDown size={13} strokeWidth={2} /> Download PDF
              </a>
            </>
          }
        />

        {/* 2. Agenda */}
        <DownloadCard
          icon={<CalendarDays size={18} strokeWidth={1.7} />}
          title="Agenda"
          description="Full event schedule with speakers and tracks"
          actions={
            <>
              <PillBtn onClick={downloadAgendaCSV} variant="green">
                <FileSpreadsheet size={13} strokeWidth={2} /> Spreadsheet
              </PillBtn>
              <a
                href={`/api/events/${eventId}/agenda/pdf`}
                download={`karta-agenda-${slug}.pdf`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition hover:opacity-80"
                style={{ background: 'white', color: '#3A4A42', border: '1px solid #E5E0D4' }}
              >
                <FileDown size={13} strokeWidth={2} /> Download PDF
              </a>
            </>
          }
        />

        {/* 3. Revenue Report */}
        <DownloadCard
          icon={<TrendingUp size={18} strokeWidth={1.7} />}
          title="Revenue Report"
          description="Financial summary and ticket sales breakdown"
          actions={
            <>
              <PillBtn onClick={downloadRevenueCSV} variant="green">
                <FileSpreadsheet size={13} strokeWidth={2} /> Spreadsheet
              </PillBtn>
              <a
                href={`/api/events/${eventId}/revenue/pdf`}
                download={`karta-revenue-${slug}.pdf`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition hover:opacity-80"
                style={{ background: 'white', color: '#3A4A42', border: '1px solid #E5E0D4' }}
              >
                <FileDown size={13} strokeWidth={2} /> Download PDF
              </a>
            </>
          }
        />

        {/* 4. Karta Cards & Badges */}
        <DownloadCard
          icon={<IdCard size={18} strokeWidth={1.7} />}
          title="Cards & Badges"
          description="Personalized attendee cards and name badges"
          actions={
            <>
              <Link
                href={`/events/${eventId}/karta-card`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-white transition hover:opacity-90"
                style={{ background: '#1F4D3A', border: '1px solid #1F4D3A' }}
              >
                Go to Cards
              </Link>
            </>
          }
        />

      </div>
    </div>
  );
}
