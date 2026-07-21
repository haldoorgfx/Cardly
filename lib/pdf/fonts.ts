// Font handling for generated PDFs.
//
// WHY THIS EXISTS
//
// pdfkit's built-in Helvetica is a single-byte WinAnsi font. Handed a string it
// cannot encode, it does not throw — it writes the raw code points out as bytes.
// An Arabic event name "مؤتمر التقنية" was emitted as the byte sequence
// 64 56 24 62 a6 45 ... and rendered in Acrobat as Latin gibberish that looks
// like corrupt data rather than a missing font. Amharic behaved the same way.
// For a platform whose primary markets are Djibouti, Ethiopia, Kenya, Somalia
// and the UAE, that is a real output-correctness bug, not a cosmetic one.
//
// Embedding a real TTF makes pdfkit go through fontkit, which gives us proper
// Unicode cmap lookup, glyph subsetting, and OpenType shaping — including
// correct right-to-left ordering and contextual letterforms for Arabic.
//
// The fonts are read from the same base64 bundle /api/render already uses, so
// they are guaranteed to be present in the serverless bundle without any
// outputFileTracingIncludes wiring.

import { FONT_DATA } from '@/lib/fonts/embedded-font-data';

/** Registered font names used with doc.font(...). */
export const FONT = {
  regular: 'body',
  bold: 'bodyBold',
  arabic: 'arabic',
  arabicBold: 'arabicBold',
} as const;

const decoded = new Map<string, Buffer>();
function fontBuffer(key: string): Buffer {
  let buf = decoded.get(key);
  if (!buf) {
    buf = Buffer.from(FONT_DATA[key], 'base64');
    decoded.set(key, buf);
  }
  return buf;
}

/**
 * Register the brand fonts on a document. Call once, right after creating it.
 *
 * Inter is the brand body font (BRAND.md / CLAUDE.md); Helvetica was never part
 * of the brand system, so this also brings generated PDFs in line with the rest
 * of the product.
 */
export function registerFonts(doc: PDFKit.PDFDocument): void {
  doc.registerFont(FONT.regular, fontBuffer('inter-400'));
  doc.registerFont(FONT.bold, fontBuffer('inter-700'));
  doc.registerFont(FONT.arabic, fontBuffer('notosansarabic-400'));
  doc.registerFont(FONT.arabicBold, fontBuffer('notosansarabic-700'));
}

// Arabic, Arabic Supplement, Arabic Extended-A, Arabic Presentation Forms.
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Latin, Latin-1 Supplement, Latin Extended-A/B — the range Inter covers.
const LATIN = /[A-Za-z\u00C0-\u024F]/;

/**
 * Pick the font that can actually render this string.
 *
 * Inter has no Arabic coverage and Noto Sans Arabic has no Latin coverage, and
 * pdfkit has no per-run font fallback. So the choice is made per string: if the
 * string is predominantly Arabic we draw it with Noto, otherwise Inter. An
 * attendee name or event title is virtually always wholly one script, which is
 * the case this handles correctly. Mixed-script strings fall back to Inter and
 * the Arabic portion will show as missing glyphs — visibly absent rather than
 * silently wrong, which is the important difference.
 */
export function fontFor(text: string, bold = false): string {
  if (!text) return bold ? FONT.bold : FONT.regular;

  if (ARABIC.test(text)) {
    // Switch only when Arabic strictly outnumbers the Latin letters. On a tie
    // ("Room 3 (قاعة)") Inter wins: digits, spacing and punctuation are shared
    // between both fonts but Noto Sans Arabic has no Latin coverage at all, so
    // choosing it for a half-Latin string would blank out more than it saves.
    const chars = Array.from(text);
    const arabic = chars.filter((c) => ARABIC.test(c)).length;
    const latin = chars.filter((c) => LATIN.test(c)).length;
    if (arabic > latin) {
      return bold ? FONT.arabicBold : FONT.arabic;
    }
  }
  return bold ? FONT.bold : FONT.regular;
}

/**
 * Select the right font for `text` and return the doc for chaining:
 *   withFont(doc, name, true).fontSize(10).text(name, x, y)
 */
export function withFont(doc: PDFKit.PDFDocument, text: string, bold = false): PDFKit.PDFDocument {
  return doc.font(fontFor(text, bold));
}

// Scripts we ship no font for at all. Ethiopic (Amharic/Tigrinya) is the one
// that matters for Ethiopia — neither Inter nor Noto Sans Arabic covers it.
const UNSUPPORTED = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/;

/**
 * Replace characters no bundled font can draw with a visible marker.
 *
 * Without this, unsupported text maps to .notdef and disappears entirely — an
 * Amharic attendee name would print as an empty cell on a check-in roster, and
 * the organizer would have no idea a name was ever there. A marker at least
 * says "this exists but could not be printed".
 *
 * The marker is '?' specifically because Inter has a glyph for it. A prettier
 * choice like '□' (U+25A1) is not in Inter's coverage, so it would itself land
 * on .notdef and vanish — the exact problem this function exists to prevent.
 */
export function pdfSafe(text: string | null | undefined): string {
  if (!text) return '';
  if (!UNSUPPORTED.test(text)) return text;
  return text.replace(new RegExp(`${UNSUPPORTED.source}+`, 'g'), '?');
}
