/**
 * Importable-entity definitions for the CSV import wizard.
 *
 * Each entity declares its columns (label, type, required, example, aliases)
 * and a `toPayload` that converts one mapped row of string cells into the
 * exact JSON body the existing create endpoint expects — so imported rows go
 * through the same server-side validation as manual entry and can never write
 * malformed data. `toPayload` returns `{ error }` for client-catchable issues.
 */

import { parseDateCell } from './csv';

export type ImportFieldType = 'text' | 'number' | 'integer' | 'datetime' | 'enum' | 'boolean';

export interface ImportField {
  key: string;
  label: string;
  type: ImportFieldType;
  required?: boolean;
  enumValues?: string[];
  example: string;
  /** Extra header strings (besides the label) that auto-map to this field. */
  aliases?: string[];
  help?: string;
}

export interface ImportEntity {
  /** Stable key, e.g. "tickets". */
  key: string;
  /** Plural human label, e.g. "ticket types". */
  label: string;
  /** Singular human label, e.g. "ticket type". */
  singular: string;
  /** Filename stem for the template download. */
  templateName: string;
  fields: ImportField[];
  /** Build the POST body for the create endpoint, or return a row error. */
  toPayload: (row: Record<string, string>) => { payload?: Record<string, unknown>; error?: string };
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

function num(raw: string): number | null | 'INVALID' {
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 'INVALID' : n;
}

function int(raw: string): number | null | 'INVALID' {
  const n = num(raw);
  if (n === 'INVALID' || n === null) return n;
  return Math.round(n);
}

function bool(raw: string): boolean {
  return /^(true|yes|y|1|x|✓)$/i.test(raw.trim());
}

function matchEnum(raw: string, values: string[]): string | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  return values.find(v => v.toLowerCase() === s) ?? null;
}

/* ── Tickets ──────────────────────────────────────────────────────────────── */

const tickets: ImportEntity = {
  key: 'tickets',
  label: 'ticket types',
  singular: 'ticket type',
  templateName: 'karta-tickets-template',
  fields: [
    { key: 'name',          label: 'Name',          type: 'text',     required: true, example: 'General Admission', aliases: ['ticket', 'ticket name', 'title'] },
    { key: 'price',         label: 'Price',         type: 'number',   example: '50',  aliases: ['cost', 'amount'], help: 'Leave blank or 0 for free' },
    { key: 'quantity',      label: 'Quantity',      type: 'integer',  example: '200', aliases: ['qty', 'capacity', 'available'], help: 'Blank = unlimited' },
    { key: 'description',   label: 'Description',   type: 'text',     example: 'Full event access' },
    { key: 'min_per_order', label: 'Min per order', type: 'integer',  example: '1',   aliases: ['min'] },
    { key: 'max_per_order', label: 'Max per order', type: 'integer',  example: '10',  aliases: ['max'] },
    { key: 'sales_start',   label: 'Sales start',   type: 'datetime', example: '2026-06-01 09:00', aliases: ['start', 'on sale'] },
    { key: 'sales_end',     label: 'Sales end',     type: 'datetime', example: '2026-07-13 18:00', aliases: ['end', 'sale ends'] },
  ],
  toPayload(row) {
    const name = (row.name ?? '').trim();
    if (!name) return { error: 'Name is required' };

    const payload: Record<string, unknown> = { name };

    for (const [key, parser] of [
      ['price', num], ['quantity', int], ['min_per_order', int], ['max_per_order', int],
    ] as const) {
      const v = parser(row[key] ?? '');
      if (v === 'INVALID') return { error: `${key.replace(/_/g, ' ')} must be a number` };
      if (v !== null) payload[key] = v;
    }
    if ((row.description ?? '').trim()) payload.description = row.description.trim();

    for (const key of ['sales_start', 'sales_end'] as const) {
      const v = parseDateCell(row[key] ?? '');
      if (v === 'INVALID') return { error: `${key.replace(/_/g, ' ')} is not a valid date` };
      if (v !== null) payload[key] = v;
    }
    return { payload };
  },
};

/* ── Sessions ─────────────────────────────────────────────────────────────── */

const SESSION_TYPES = ['talk', 'keynote', 'workshop', 'panel', 'fireside', 'lightning', 'break'];

const sessions: ImportEntity = {
  key: 'sessions',
  label: 'sessions',
  singular: 'session',
  templateName: 'karta-agenda-template',
  fields: [
    { key: 'title',        label: 'Title',        type: 'text',     required: true, example: 'Opening Keynote', aliases: ['session', 'name', 'session name'] },
    { key: 'starts_at',    label: 'Start',        type: 'datetime', required: true, example: '2026-07-13 09:00', aliases: ['start', 'start time', 'from'] },
    { key: 'ends_at',      label: 'End',          type: 'datetime', required: true, example: '2026-07-13 10:00', aliases: ['end', 'end time', 'to'] },
    { key: 'session_type', label: 'Type',         type: 'enum',     enumValues: SESSION_TYPES, example: 'keynote', aliases: ['kind'], help: SESSION_TYPES.join(', ') },
    { key: 'room',         label: 'Room',         type: 'text',     example: 'Main Stage', aliases: ['stage', 'location', 'hall'] },
    { key: 'capacity',     label: 'Capacity',     type: 'integer',  example: '150', aliases: ['seats', 'max'] },
    { key: 'description',  label: 'Description',  type: 'text',     example: 'Welcome & opening remarks', aliases: ['details', 'abstract'] },
  ],
  toPayload(row) {
    const title = (row.title ?? '').trim();
    if (!title) return { error: 'Title is required' };

    const starts = parseDateCell(row.starts_at ?? '');
    const ends = parseDateCell(row.ends_at ?? '');
    if (starts === 'INVALID' || starts === null) return { error: 'Start is required and must be a valid date/time' };
    if (ends === 'INVALID' || ends === null) return { error: 'End is required and must be a valid date/time' };

    const payload: Record<string, unknown> = { title, starts_at: starts, ends_at: ends };

    const type = matchEnum(row.session_type ?? '', SESSION_TYPES);
    if ((row.session_type ?? '').trim() && !type) {
      return { error: `Type must be one of: ${SESSION_TYPES.join(', ')}` };
    }
    if (type) payload.session_type = type;

    if ((row.room ?? '').trim()) payload.room = row.room.trim();
    if ((row.description ?? '').trim()) payload.description = row.description.trim();

    const cap = int(row.capacity ?? '');
    if (cap === 'INVALID') return { error: 'Capacity must be a number' };
    if (cap !== null) payload.capacity = cap;

    return { payload };
  },
};

/* ── Speakers ─────────────────────────────────────────────────────────────── */

const SPEAKER_TYPES = ['keynote', 'speaker', 'panelist', 'workshop', 'mc'];

const speakers: ImportEntity = {
  key: 'speakers',
  label: 'speakers',
  singular: 'speaker',
  templateName: 'karta-speakers-template',
  fields: [
    { key: 'name',         label: 'Name',         type: 'text', required: true, example: 'Amina Yusuf', aliases: ['full name', 'speaker', 'speaker name'] },
    { key: 'headline',     label: 'Headline',     type: 'text', example: 'CEO at Acme', aliases: ['tagline'] },
    { key: 'role',         label: 'Role',         type: 'text', example: 'Chief Executive', aliases: ['position', 'job title', 'title'] },
    { key: 'company',      label: 'Company',      type: 'text', example: 'Acme Inc', aliases: ['organization', 'org'] },
    { key: 'bio',          label: 'Bio',          type: 'text', example: 'Amina has 15 years…', aliases: ['biography', 'about'] },
    { key: 'photo_url',    label: 'Photo URL',    type: 'text', example: 'https://…/amina.jpg', aliases: ['photo', 'image', 'avatar'] },
    { key: 'speaker_type', label: 'Type',         type: 'enum', enumValues: SPEAKER_TYPES, example: 'keynote', help: SPEAKER_TYPES.join(', ') },
    { key: 'is_featured',  label: 'Featured',     type: 'boolean', example: 'yes', aliases: ['feature'] },
  ],
  toPayload(row) {
    const name = (row.name ?? '').trim();
    if (!name) return { error: 'Name is required' };

    const payload: Record<string, unknown> = { name };
    for (const key of ['headline', 'role', 'company', 'bio', 'photo_url'] as const) {
      if ((row[key] ?? '').trim()) payload[key] = row[key].trim();
    }

    const type = matchEnum(row.speaker_type ?? '', SPEAKER_TYPES);
    if ((row.speaker_type ?? '').trim() && !type) {
      return { error: `Type must be one of: ${SPEAKER_TYPES.join(', ')}` };
    }
    if (type) payload.speaker_type = type;

    if ((row.is_featured ?? '').trim()) payload.is_featured = bool(row.is_featured);

    return { payload };
  },
};

/* ── Promo codes ──────────────────────────────────────────────────────────── */

const promoCodes: ImportEntity = {
  key: 'promo',
  label: 'promo codes',
  singular: 'promo code',
  templateName: 'karta-promo-codes-template',
  fields: [
    { key: 'code',           label: 'Code',          type: 'text',    required: true, example: 'EARLYBIRD', aliases: ['coupon', 'promo'] },
    { key: 'discount_type',  label: 'Discount type', type: 'enum',    enumValues: ['percent', 'fixed'], required: true, example: 'percent', aliases: ['type'] },
    { key: 'discount_value', label: 'Discount value',type: 'number',  required: true, example: '20', aliases: ['value', 'amount', 'discount'] },
    { key: 'max_uses',       label: 'Max uses',      type: 'integer', example: '100', aliases: ['uses', 'limit', 'usage limit'] },
    { key: 'valid_from',     label: 'Valid from',    type: 'datetime', example: '2026-06-01 00:00', aliases: ['from', 'start'] },
    { key: 'valid_until',    label: 'Valid until',   type: 'datetime', example: '2026-07-01 00:00', aliases: ['until', 'expires', 'end'] },
  ],
  toPayload(row) {
    const code = (row.code ?? '').trim().toUpperCase();
    if (!code) return { error: 'Code is required' };
    if (!/^[A-Z0-9_-]+$/.test(code)) return { error: 'Code may only contain letters, numbers, hyphens, underscores' };
    if (code.length < 2) return { error: 'Code must be at least 2 characters' };

    const type = matchEnum(row.discount_type ?? '', ['percent', 'fixed']);
    if (!type) return { error: 'Discount type must be "percent" or "fixed"' };

    const value = num(row.discount_value ?? '');
    if (value === 'INVALID' || value === null) return { error: 'Discount value is required and must be a number' };
    if (value <= 0) return { error: 'Discount value must be greater than 0' };

    const payload: Record<string, unknown> = { code, discount_type: type, discount_value: value };

    const maxUses = int(row.max_uses ?? '');
    if (maxUses === 'INVALID') return { error: 'Max uses must be a number' };
    if (maxUses !== null) payload.max_uses = maxUses;

    for (const key of ['valid_from', 'valid_until'] as const) {
      const v = parseDateCell(row[key] ?? '');
      if (v === 'INVALID') return { error: `${key.replace(/_/g, ' ')} is not a valid date` };
      if (v !== null) payload[key] = v;
    }
    return { payload };
  },
};

/* ── Registry ─────────────────────────────────────────────────────────────── */

export const IMPORT_ENTITIES = { tickets, sessions, speakers, promo: promoCodes } as const;
export type ImportEntityKey = keyof typeof IMPORT_ENTITIES;
