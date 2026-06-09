import {
  streamToBuffer, drawHeader, drawFooter, today,
} from './helpers';
import { C, M, CW, PH } from './brand';

interface Speaker { name: string; title?: string | null; company?: string | null }
interface Session {
  id: string;
  title: string;
  session_type: string | null;
  start_time: string | null;
  end_time: string | null;
  location?: string | null;
  description?: string | null;
  speakers?: Speaker[];
}
interface AgendaDay { date: string; label: string; sessions: Session[] }

function typeLabel(t: string | null): string {
  const map: Record<string, string> = {
    keynote:  'Keynote',
    talk:     'Talk',
    workshop: 'Workshop',
    panel:    'Panel',
    fireside: 'Fireside Chat',
    break:    'Break',
    networking: 'Networking',
  };
  return map[t ?? ''] ?? (t ?? 'Session');
}

function typeDot(t: string | null): string {
  const map: Record<string, string> = {
    keynote:  C.accent,
    talk:     C.primary,
    workshop: '#3A6B8C',
    panel:    C.warning,
    fireside: C.warning,
    break:    C.border,
  };
  return map[t ?? ''] ?? C.muted;
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

export async function generateAgendaPDF(
  eventName: string,
  days: AgendaDay[],
): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true, bufferPages: true });
  const bufferPromise = streamToBuffer(doc);

  const dateStr = today();
  const FOOTER_Y = PH - 40;

  // ── Header ─────────────────────────────────────────────────────────────────
  drawHeader(doc, eventName, 'AGENDA', dateStr);

  let y = 88;

  for (const day of days) {
    // Day heading
    if (y + 30 > FOOTER_Y) {
      drawFooter(doc, dateStr);
      doc.addPage();
      y = 20;
    }

    // Day label bar
    doc.rect(M, y, CW, 26).fill(C.primarySoft);
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor(C.primary)
       .text(day.label.toUpperCase(), M + 10, y + 8, { characterSpacing: 1 });
    y += 26 + 4;

    for (const session of day.sessions) {
      const isKeynote = session.session_type === 'keynote';
      const isBreak   = session.session_type === 'break';
      const cardH     = isKeynote ? 62 : isBreak ? 28 : 48;

      if (y + cardH > FOOTER_Y) {
        drawFooter(doc, dateStr);
        doc.addPage();
        y = 20;
      }

      // Card background
      if (isKeynote) {
        doc.rect(M, y, CW, cardH).fill(C.primary);
      } else if (isBreak) {
        doc.rect(M, y, CW, cardH)
           .lineWidth(0.5).fillAndStroke(C.creams, C.border);
      } else {
        doc.rect(M, y, CW, cardH)
           .lineWidth(0.4).fillAndStroke(C.white, C.border);
      }

      // Left accent line (non-keynote, non-break)
      if (!isKeynote && !isBreak) {
        doc.rect(M, y, 3, cardH).fill(typeDot(session.session_type));
      }

      const leftPad = isKeynote ? M + 14 : M + 10;

      // Time
      const timeStr = [fmtTime(session.start_time), fmtTime(session.end_time)]
        .filter(Boolean).join(' – ');
      if (timeStr) {
        doc.font('Helvetica')
           .fontSize(7.5)
           .fillColor(isKeynote ? '#A8C4B8' : C.muted)
           .text(timeStr, leftPad, y + (isBreak ? 9 : 8));
      }

      // Title
      const titleY = timeStr ? y + 18 : y + (isBreak ? 9 : 14);
      doc.font('Helvetica-Bold')
         .fontSize(isKeynote ? 11 : isBreak ? 8.5 : 9.5)
         .fillColor(isKeynote ? C.cream : isBreak ? C.muted : C.ink)
         .text(session.title, leftPad, titleY, {
           width: CW - (leftPad - M) - (isBreak ? 8 : 40),
           lineBreak: false,
           ellipsis: true,
         });

      // Type badge (non-break)
      if (!isBreak) {
        const dot = typeDot(session.session_type);
        doc.font('Helvetica')
           .fontSize(7)
           .fillColor(isKeynote ? C.accent : dot)
           .text(typeLabel(session.session_type), M + CW - 70, y + 8, {
             width: 68,
             align: 'right',
             lineBreak: false,
           });
      }

      // Speakers (keynote or tall card)
      if (!isBreak && session.speakers && session.speakers.length > 0 && cardH >= 48) {
        const speakerStr = session.speakers
          .map(s => [s.name, s.company].filter(Boolean).join(', '))
          .join(' · ');
        doc.font('Helvetica')
           .fontSize(7.5)
           .fillColor(isKeynote ? '#A8C4B8' : C.muted)
           .text(speakerStr, leftPad, y + cardH - 15, {
             width: CW - (leftPad - M) - 10,
             lineBreak: false,
             ellipsis: true,
           });
      }

      // Location (if present, non-break)
      if (!isBreak && session.location) {
        doc.font('Helvetica')
           .fontSize(7.5)
           .fillColor(isKeynote ? '#A8C4B8' : C.muted)
           .text(`📍 ${session.location}`, M + CW - 120, y + cardH - 15, {
             width: 118,
             align: 'right',
             lineBreak: false,
             ellipsis: true,
           });
      }

      y += cardH + 3;
    }

    y += 12; // space between days
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  drawFooter(doc, dateStr);

  doc.end();
  return bufferPromise;
}
