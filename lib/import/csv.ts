/**
 * Lightweight RFC-4180 CSV parsing + serialization.
 * No external dependencies (the stack is locked — see CLAUDE.md).
 *
 * Handles: quoted fields, escaped quotes (""), commas and newlines inside
 * quotes, CRLF/LF line endings, and a leading UTF-8 BOM.
 */

/** Parse CSV text into rows of string cells. Empty trailing line is ignored. */
export function parseCSV(input: string): string[][] {
  // Strip BOM if present (Excel loves adding one).
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; } // escaped quote
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }

    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; } // ignore, handled by \n
    if (c === '\n') {
      row.push(field); rows.push(row);
      row = []; field = ''; i++; continue;
    }
    field += c; i++;
  }

  // Flush the final field/row if there's anything pending.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty rows (e.g. blank lines between data).
  return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

/** Quote a single CSV cell when it contains a comma, quote, or newline. */
function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize rows of cells back into CSV text (with a trailing newline). */
export function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map(r => r.map(cell => escapeCell(cell == null ? '' : String(cell))).join(','))
    .join('\r\n') + '\r\n';
}

/**
 * Trigger a client-side download of CSV text as a file.
 * Prepends a BOM so Excel opens UTF-8 content correctly.
 */
export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse a date/time cell into an ISO string.
 * Accepts ISO, "YYYY-MM-DD HH:mm", "YYYY-MM-DDTHH:mm", "MM/DD/YYYY HH:mm",
 * and plain dates. Returns null for blank input, or 'INVALID' if unparseable.
 */
export function parseDateCell(raw: string): string | null | 'INVALID' {
  const s = raw.trim();
  if (!s) return null;
  // Normalize "2026-07-13 08:20" → "2026-07-13T08:20"
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) ? s.replace(' ', 'T') : s;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return 'INVALID';
  return d.toISOString();
}
