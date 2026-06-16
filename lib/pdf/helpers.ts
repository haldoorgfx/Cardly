// pdfkit uses `export =` (CommonJS), so we must import as a value and derive the instance type
import PDFDocument from 'pdfkit';
type PDFDocumentType = InstanceType<typeof PDFDocument>;
import { C, M, CW, PW, PH } from './brand';

// ── Collect pdfkit stream into a Buffer ───────────────────────────────────────
export function streamToBuffer(doc: PDFDocumentType): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data',  (c: Buffer) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

// ── Branded page header ───────────────────────────────────────────────────────
// Call before drawing any content on a new page.
export function drawHeader(
  doc: PDFDocumentType,
  eventName: string,
  docLabel: string,     // e.g. "ATTENDEE ROSTER"
  dateStr: string,
): void {
  const H = 72;

  // Green bar
  doc.rect(0, 0, PW, H).fill(C.primary);

  // "EVENTERA" brand mark — top-left
  doc.font('Helvetica-Bold')
     .fontSize(7)
     .fillColor(C.accent)
     .text('EVENTERA', M, 16, { characterSpacing: 3 });

  // Event name
  doc.font('Helvetica-Bold')
     .fontSize(18)
     .fillColor(C.cream)
     .text(eventName, M, 28, { width: CW * 0.65, lineBreak: false, ellipsis: true });

  // Document type — right side
  doc.font('Helvetica-Bold')
     .fontSize(8)
     .fillColor(C.accent)
     .text(docLabel, M, 20, { width: CW, align: 'right', characterSpacing: 1.5 });

  // Date — right side below
  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor('rgba(250,246,238,0.55)') // pdfkit doesn't support rgba, use approximate
     .fillColor('#A8C4B8')                // soft cream-green stand-in
     .text(dateStr, M, 34, { width: CW, align: 'right' });

  // Accent line below header
  doc.rect(0, H, PW, 3).fill(C.accent);
}

// ── Section heading ───────────────────────────────────────────────────────────
export function drawSectionHeading(doc: PDFDocumentType, text: string, y: number): void {
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor(C.ink)
     .text(text, M, y);
}

// ── Horizontal rule ───────────────────────────────────────────────────────────
export function drawRule(doc: PDFDocumentType, y: number, color = C.border, width = 1): void {
  doc.moveTo(M, y).lineTo(M + CW, y).lineWidth(width).strokeColor(color).stroke();
}

// ── Stat box (small labeled number) ──────────────────────────────────────────
export function drawStatBox(
  doc: PDFDocumentType,
  x: number, y: number,
  w: number, h: number,
  label: string, value: string | number,
  valueColor = C.ink,
): void {
  // Box background
  doc.rect(x, y, w, h).fill(C.cream);
  doc.rect(x, y, w, h).lineWidth(0.75).strokeColor(C.border).stroke();

  // Value — large
  doc.font('Helvetica-Bold')
     .fontSize(24)
     .fillColor(valueColor)
     .text(String(value), x, y + 10, { width: w, align: 'center' });

  // Label — small, below value
  doc.font('Helvetica')
     .fontSize(8)
     .fillColor(C.muted)
     .text(label, x, y + h - 18, { width: w, align: 'center' });
}

// ── Table header row ──────────────────────────────────────────────────────────
export interface ColDef {
  label: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

export function drawTableHeader(
  doc: PDFDocumentType,
  y: number,
  cols: ColDef[],
  rowH = 22,
): void {
  // Header background
  doc.rect(M, y, CW, rowH).fill(C.primarySoft);

  // Column labels
  let x = M;
  for (const col of cols) {
    doc.font('Helvetica-Bold')
       .fontSize(7.5)
       .fillColor(C.muted)
       .text(col.label.toUpperCase(), x + 5, y + (rowH - 7.5) / 2, {
         width: col.width - 10,
         align: col.align ?? 'left',
         lineBreak: false,
         characterSpacing: 0.8,
       });
    x += col.width;
  }
}

// ── Table data row ────────────────────────────────────────────────────────────
export function drawTableRow(
  doc: PDFDocumentType,
  y: number,
  cols: ColDef[],
  cells: { text: string; color?: string }[],
  isAlt: boolean,
  rowH = 22,
): void {
  if (isAlt) doc.rect(M, y, CW, rowH).fill(C.creams);

  // Bottom border
  doc.moveTo(M, y + rowH).lineTo(M + CW, y + rowH)
     .lineWidth(0.4).strokeColor(C.border).stroke();

  let x = M;
  for (let i = 0; i < cols.length; i++) {
    const col   = cols[i];
    const cell  = cells[i] ?? { text: '' };
    doc.font('Helvetica')
       .fontSize(8.5)
       .fillColor(cell.color ?? C.inkSoft)
       .text(cell.text, x + 5, y + (rowH - 8.5) / 2 + 1, {
         width: col.width - 10,
         align: col.align ?? 'left',
         lineBreak: false,
         ellipsis: true,
       });
    x += col.width;
  }
}

// ── Page footer ───────────────────────────────────────────────────────────────
export function drawFooter(doc: PDFDocumentType, dateStr: string): void {
  const y = PH - 28;
  doc.rect(0, y - 4, PW, 32).fill(C.creams);
  doc.moveTo(0, y - 4).lineTo(PW, y - 4).lineWidth(0.5).strokeColor(C.border).stroke();

  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor(C.muted)
     .text('Generated with Eventera · karta.cre8so.com', M, y + 4);

  doc.font('Helvetica')
     .fontSize(7.5)
     .fillColor(C.muted)
     .text(dateStr, M, y + 4, { width: CW, align: 'right' });
}

// ── Status text color ─────────────────────────────────────────────────────────
export function statusColor(status: string): string {
  switch (status) {
    case 'checked_in': return C.success;
    case 'confirmed':  return C.warning;
    case 'cancelled':  return C.danger;
    default:           return C.muted;
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    confirmed:  'Confirmed',
    checked_in: 'Checked In',
    pending:    'Pending',
    cancelled:  'Cancelled',
    waitlisted: 'Waitlisted',
  };
  return map[status] ?? status;
}

export function fmtCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function today(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
