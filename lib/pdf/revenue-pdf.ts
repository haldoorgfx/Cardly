import {
  streamToBuffer, drawHeader, drawFooter, drawStatBox,
  drawTableHeader, drawTableRow, drawRule, drawSectionHeading, fmtCurrency, today,
  type ColDef,
} from './helpers';
import { C, M, CW, PH } from './brand';

interface Reg {
  id: string;
  status: string;
  amount_paid: number | null;
  currency: string | null;
  ticket_type_id: string | null;
}

interface TicketType {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
}

export async function generateRevenuePDF(
  eventName: string,
  regs: Reg[],
  ticketTypes: TicketType[],
): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true, bufferPages: true });
  const bufferPromise = streamToBuffer(doc);

  const dateStr = today();

  const confirmed  = regs.filter(r => ['confirmed', 'checked_in'].includes(r.status));
  const totalRev   = confirmed.reduce((s, r) => s + (r.amount_paid ?? 0), 0);
  const currency   = confirmed.find(r => r.currency)?.currency ?? 'USD';

  // ── Header ─────────────────────────────────────────────────────────────────
  drawHeader(doc, eventName, 'REVENUE REPORT', dateStr);

  // ── Hero revenue block ─────────────────────────────────────────────────────
  const heroY = 88;
  const heroH = 68;
  doc.rect(M, heroY, CW, heroH).fill(C.primary);

  // "Total Revenue" label
  doc.font('Helvetica-Bold')
     .fontSize(7.5)
     .fillColor('#A8C4B8')
     .text('TOTAL REVENUE', M + 16, heroY + 14, { characterSpacing: 1.2 });

  // Big revenue number
  doc.font('Helvetica-Bold')
     .fontSize(32)
     .fillColor(C.cream)
     .text(fmtCurrency(totalRev, currency), M + 16, heroY + 24, {
       lineBreak: false,
       characterSpacing: -0.5,
     });

  // Confirmed registrations — right side
  doc.font('Helvetica-Bold')
     .fontSize(7.5)
     .fillColor('#A8C4B8')
     .text('CONFIRMED', M, heroY + 14, { width: CW - 16, align: 'right', characterSpacing: 1.2 });

  doc.font('Helvetica-Bold')
     .fontSize(28)
     .fillColor(C.accent)
     .text(String(confirmed.length), M, heroY + 26, { width: CW - 16, align: 'right' });

  // ── Registration status stat boxes ─────────────────────────────────────────
  const statY = heroY + heroH + 14;
  const statW = (CW - 24) / 4;
  const statH = 50;
  const statuses = [
    { label: 'Confirmed',  value: regs.filter(r => r.status === 'confirmed').length,  color: C.warning  },
    { label: 'Checked In', value: regs.filter(r => r.status === 'checked_in').length, color: C.success  },
    { label: 'Pending',    value: regs.filter(r => r.status === 'pending').length,    color: C.muted    },
    { label: 'Cancelled',  value: regs.filter(r => r.status === 'cancelled').length,  color: C.danger   },
  ];
  statuses.forEach((s, i) => {
    drawStatBox(doc, M + i * (statW + 8), statY, statW, statH, s.label, s.value, s.color);
  });

  // ── Ticket type breakdown table ────────────────────────────────────────────
  let y = statY + statH + 22;
  drawSectionHeading(doc, 'Breakdown by Ticket Type', y);
  y += 18;

  const BREAK_COLS: ColDef[] = [
    { label: 'Ticket Type', width: 200              },
    { label: 'Unit Price',  width:  90, align: 'right'  },
    { label: 'Sold',        width:  65, align: 'right'  },
    { label: 'Revenue',     width: 160, align: 'right'  },
  ];
  const ROW_H = 24;

  drawTableHeader(doc, y, BREAK_COLS, ROW_H);
  y += ROW_H;

  let grandTotalSold = 0;
  let grandTotalRev  = 0;
  const FOOTER_Y = PH - 40;

  ticketTypes.forEach((tt, i) => {
    if (y + ROW_H > FOOTER_Y) {
      drawFooter(doc, dateStr);
      doc.addPage();
      y = 20;
      drawTableHeader(doc, y, BREAK_COLS, ROW_H);
      y += ROW_H;
    }

    const ttRegs = confirmed.filter(r => r.ticket_type_id === tt.id);
    const sold   = ttRegs.length;
    const rev    = ttRegs.reduce((s, r) => s + (r.amount_paid ?? 0), 0);
    grandTotalSold += sold;
    grandTotalRev  += rev;

    const price = tt.price != null && tt.price > 0 ? fmtCurrency(tt.price, tt.currency ?? currency) : 'Free';

    drawTableRow(doc, y, BREAK_COLS, [
      { text: tt.name,              color: C.ink      },
      { text: price,                color: C.inkSoft  },
      { text: String(sold),         color: C.inkSoft  },
      { text: rev > 0 ? fmtCurrency(rev, currency) : '—', color: rev > 0 ? C.success : C.muted },
    ], i % 2 === 1, ROW_H);

    y += ROW_H;
  });

  // Total row
  if (y + ROW_H <= FOOTER_Y) {
    // Dark total row
    doc.rect(M, y, CW, ROW_H).fill(C.primarySoft);
    doc.moveTo(M, y).lineTo(M + CW, y).lineWidth(1).strokeColor(C.primary).stroke();

    let x = M;
    const totalCells = [
      { text: 'TOTAL', color: C.primary, bold: true },
      { text: '', color: C.ink },
      { text: String(grandTotalSold), color: C.primary, bold: true },
      { text: fmtCurrency(grandTotalRev, currency), color: C.primary, bold: true },
    ];
    totalCells.forEach((cell, ci) => {
      const col = BREAK_COLS[ci];
      doc.font(cell.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(8.5)
         .fillColor(cell.color ?? C.ink)
         .text(cell.text, x + 5, y + (ROW_H - 8.5) / 2 + 1, {
           width: col.width - 10,
           align: col.align ?? 'left',
           lineBreak: false,
         });
      x += col.width;
    });
    y += ROW_H;
  }

  // ── Closing rule ───────────────────────────────────────────────────────────
  if (y < FOOTER_Y - 10) drawRule(doc, y + 8, C.border);

  // ── Footer ─────────────────────────────────────────────────────────────────
  drawFooter(doc, dateStr);

  doc.end();
  return bufferPromise;
}
