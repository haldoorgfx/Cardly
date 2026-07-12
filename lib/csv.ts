// Small, dependency-free CSV helpers for admin exports.
//
// RFC-4180-ish: fields containing a comma, quote, or newline are wrapped in
// double quotes and inner quotes are doubled. A UTF-8 BOM is prepended so
// Excel opens accented characters correctly.

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

function escapeCell(v: string | number | boolean | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

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
