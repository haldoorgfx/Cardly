import {
  streamToBuffer, drawHeader, drawFooter, drawStatBox,
  drawTableHeader, drawTableRow, drawRule,
  statusColor, statusLabel, today,
  type ColDef,
} from './helpers';
import { C, M, CW, PH } from './brand';

interface Reg {
  id: string;
  attendee_name: string | null;
  status: string;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
  ticket_type_id: string | null;
}

interface TicketType { id: string; name: string }

export async function generateRosterPDF(
  eventName: string,
  regs: Reg[],
  ticketTypes: TicketType[],
): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true, bufferPages: true });
  const bufferPromise = streamToBuffer(doc);

  const ttMap  = new Map(ticketTypes.map(t => [t.id, t.name]));
  const dateStr = today();

  // ── Confirmed stats ────────────────────────────────────────────────────────
  const total      = regs.length;
  const confirmed  = regs.filter(r => ['confirmed', 'checked_in'].includes(r.status)).length;
  const checkedIn  = regs.filter(r => r.status === 'checked_in').length;

  // ── Page header ────────────────────────────────────────────────────────────
  drawHeader(doc, eventName, 'ATTENDEE ROSTER', dateStr);

  // ── Stat boxes ────────────────────────────────────────────────────────────
  const statY = 90;
  const statW = (CW - 16) / 3;
  const statH = 54;
  const stats = [
    { label: 'Total Registrations', value: total,     color: C.ink      },
    { label: 'Confirmed',           value: confirmed,  color: C.warning  },
    { label: 'Checked In',          value: checkedIn,  color: C.success  },
  ];
  stats.forEach((s, i) => {
    drawStatBox(doc, M + i * (statW + 8), statY, statW, statH, s.label, s.value, s.color);
  });

  // ── Table ──────────────────────────────────────────────────────────────────
  const tableTop = statY + statH + 20;

  // Column definitions — total must equal CW (515)
  const COLS: ColDef[] = [
    { label: '#',           width:  28,  align: 'center' },
    { label: 'Name',        width: 140              },
    { label: 'Ticket',      width: 110              },
    { label: 'Amount',      width:  70,  align: 'right'  },
    { label: 'Status',      width:  85              },
    { label: 'Registered',  width:  82,  align: 'right'  },
  ];
  const ROW_H = 22;

  let y = tableTop;
  drawTableHeader(doc, y, COLS, ROW_H);
  y += ROW_H;

  // Section label
  const FOOTER_Y = PH - 40;

  for (let i = 0; i < regs.length; i++) {
    // New page if we're running out of space
    if (y + ROW_H > FOOTER_Y) {
      drawFooter(doc, dateStr);
      doc.addPage();
      y = 20;
      drawTableHeader(doc, y, COLS, ROW_H);
      y += ROW_H;
    }

    const r  = regs[i];
    const tt = r.ticket_type_id ? (ttMap.get(r.ticket_type_id) ?? '—') : '—';
    const amt = r.amount_paid != null && r.amount_paid > 0
      ? `${r.currency ?? ''} ${r.amount_paid}`
      : 'Free';
    const regDate = new Date(r.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    drawTableRow(doc, y, COLS, [
      { text: String(i + 1),  color: C.muted      },
      { text: r.attendee_name ?? '—'               },
      { text: tt,             color: C.inkSoft     },
      { text: amt,            color: C.ink         },
      { text: statusLabel(r.status), color: statusColor(r.status) },
      { text: regDate,        color: C.muted       },
    ], i % 2 === 1, ROW_H);

    y += ROW_H;
  }

  // Closing rule
  if (y < FOOTER_Y - 10) {
    drawRule(doc, y, C.border);
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  drawFooter(doc, dateStr);

  doc.end();
  return bufferPromise;
}
