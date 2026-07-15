'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Download, X, Check, AlertTriangle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { parseCSV, toCSV, downloadCSV } from '@/lib/import/csv';
import type { ImportEntity } from '@/lib/import/entities';

interface Props {
  open: boolean;
  onClose: () => void;
  eventId: string;
  entity: ImportEntity;
  /** Called after a successful import with the number of records created. */
  onComplete: (insertedCount: number) => void;
}

type Step = 'upload' | 'map' | 'review';

interface RowResult {
  index: number;       // 1-based data row number (for display)
  status: 'ok' | 'skipped' | 'failed';
  message?: string;
  payload?: Record<string, unknown>;
}

const C = {
  forest: '#1F4D3A', forestDark: '#163828', soft: '#E8EFEB',
  ink: '#0F1F18', muted: '#65736B', border: '#E5E0D4', cream: '#FAF6EE',
  danger: '#B8423C', success: '#2D7A4F',
};

/** Normalize a header for fuzzy matching. */
function norm(s: string) {
  return s.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

export function ImportWizard({ open, onClose, eventId, entity, onComplete }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({}); // fieldKey -> header index (-1 = skip)
  const [parseError, setParseError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const endpoint = `/api/events/${eventId}/${entity.key}`;

  const reset = useCallback(() => {
    setStep('upload'); setFileName(''); setHeaders([]); setRows([]);
    setMapping({}); setParseError(''); setImporting(false);
    setProgress(0); setResults(null);
  }, []);

  const close = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  /* ── Template download ──────────────────────────────────────────────── */
  function handleTemplate() {
    const header = entity.fields.map(f => f.label);
    const example = entity.fields.map(f => f.example);
    downloadCSV(entity.templateName, toCSV([header, example]));
  }

  /* ── File parsing ───────────────────────────────────────────────────── */
  const autoMap = useCallback((hdrs: string[]) => {
    const map: Record<string, number> = {};
    for (const field of entity.fields) {
      const candidates = [field.label, field.key, ...(field.aliases ?? [])].map(norm);
      const idx = hdrs.findIndex(h => candidates.includes(norm(h)));
      map[field.key] = idx;
    }
    setMapping(map);
  }, [entity.fields]);

  const ingest = useCallback((text: string, name: string) => {
    setParseError('');
    const parsed = parseCSV(text);
    if (parsed.length < 1) { setParseError('That file looks empty.'); return; }
    const [hdr, ...data] = parsed;
    if (data.length === 0) { setParseError('No data rows found — only a header line.'); return; }
    setFileName(name);
    setHeaders(hdr);
    setRows(data);
    autoMap(hdr);
    setStep('map');
  }, [autoMap]);

  const onFile = useCallback((file: File) => {
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setParseError('Please upload a .csv file (export from Excel or Google Sheets).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => ingest(String(reader.result ?? ''), file.name);
    reader.onerror = () => setParseError('Could not read that file. Try re-exporting it.');
    reader.readAsText(file);
  }, [ingest]);

  /* ── Build payloads from the current mapping ────────────────────────── */
  const built = useMemo<RowResult[]>(() => {
    if (step === 'upload') return [];
    return rows.map((cells, i) => {
      const mapped: Record<string, string> = {};
      for (const field of entity.fields) {
        const idx = mapping[field.key];
        mapped[field.key] = idx != null && idx >= 0 ? (cells[idx] ?? '') : '';
      }
      const { payload, error } = entity.toPayload(mapped);
      if (error) return { index: i + 1, status: 'skipped', message: error };
      return { index: i + 1, status: 'ok', payload };
    });
  }, [rows, mapping, entity, step]);

  const validCount = built.filter(r => r.status === 'ok').length;
  const skippedCount = built.length - validCount;

  const requiredUnmapped = entity.fields.filter(f => f.required && (mapping[f.key] == null || mapping[f.key] < 0));

  /* ── Run the import ─────────────────────────────────────────────────── */
  async function runImport() {
    setImporting(true);
    setProgress(0);
    const out: RowResult[] = [];
    let done = 0;
    for (const r of built) {
      if (r.status !== 'ok' || !r.payload) { out.push(r); continue; }
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r.payload),
        });
        if (res.ok) {
          out.push({ ...r, status: 'ok' });
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = typeof data.error === 'string' ? data.error
            : data.error ? 'Validation failed' : `Server error (${res.status})`;
          out.push({ ...r, status: 'failed', message: msg });
        }
      } catch {
        out.push({ ...r, status: 'failed', message: 'Network error' });
      }
      done++;
      setProgress(Math.round((done / validCount) * 100));
    }
    setResults(out);
    setImporting(false);
    const inserted = out.filter(r => r.status === 'ok').length;
    if (inserted > 0) onComplete(inserted);
  }

  if (!open) return null;

  const insertedCount = results?.filter(r => r.status === 'ok').length ?? 0;
  const failedResults = results?.filter(r => r.status !== 'ok') ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15,31,24,0.45)' }} onClick={close}>
      <div
        className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: C.soft }}>
              <FileSpreadsheet size={16} style={{ color: C.forest }} />
            </div>
            <div>
              <h2 className="font-display text-[15px] font-semibold capitalize" style={{ color: C.ink }}>
                Import {entity.label}
              </h2>
              <p className="text-[12px]" style={{ color: C.muted }}>
                {step === 'upload' && 'Upload a CSV file'}
                {step === 'map' && 'Match your columns'}
                {step === 'review' && (results ? 'Import complete' : 'Review & import')}
              </p>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-[#F5F3EE]" aria-label="Close">
            <X size={18} style={{ color: C.muted }} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b shrink-0" style={{ borderColor: C.border, background: C.cream }}>
          {(['upload', 'map', 'review'] as Step[]).map((s, i) => {
            const order = { upload: 0, map: 1, review: 2 };
            const active = order[step] >= i;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-semibold"
                  style={{ background: active ? C.forest : '#FFF', color: active ? '#FFF' : C.muted, border: `1px solid ${active ? C.forest : C.border}` }}>
                  {i + 1}
                </span>
                <span className="text-[11.5px] font-medium capitalize hidden sm:inline" style={{ color: active ? C.ink : C.muted }}>
                  {s === 'review' ? 'Review' : s}
                </span>
                {i < 2 && <span className="w-4 sm:w-8 h-px" style={{ background: C.border }} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* ── STEP 1: UPLOAD ────────────────────────────────────────── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
                className="w-full rounded-2xl py-12 flex flex-col items-center gap-3 transition"
                style={{ border: `1.5px dashed ${dragOver ? C.forest : C.border}`, background: dragOver ? C.soft : C.cream }}
              >
                <div className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: '#FFF', border: `1px solid ${C.border}` }}>
                  <Upload size={20} style={{ color: C.forest }} />
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-medium" style={{ color: C.ink }}>Select or drop your CSV file</div>
                  <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>Exported from Excel or Google Sheets</div>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />

              {parseError && (
                <p className="text-[13px] px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{ background: 'rgba(184,66,60,0.08)', color: C.danger }}>
                  <AlertTriangle size={14} /> {parseError}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: C.soft }}>
                <div className="text-[12.5px]" style={{ color: C.ink }}>
                  <span className="font-medium">Not sure about the format?</span>
                  <span style={{ color: C.muted }}> Download a template with the exact columns.</span>
                </div>
                <button onClick={handleTemplate}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium bg-white"
                  style={{ border: `1px solid ${C.border}`, color: C.forest }}>
                  <Download size={13} /> Template
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: MAP ───────────────────────────────────────────── */}
          {step === 'map' && (
            <div className="space-y-3">
              <p className="text-[12.5px]" style={{ color: C.muted }}>
                <span className="font-medium" style={{ color: C.ink }}>{rows.length}</span> rows found in{' '}
                <span className="">{fileName}</span>. Match each Eventera field to a column from your file.
              </p>
              <div className="space-y-2">
                {entity.fields.map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-1/2 sm:w-2/5 shrink-0">
                      <div className="text-[13px] font-medium" style={{ color: C.ink }}>
                        {field.label}{field.required && <span style={{ color: C.danger }}> *</span>}
                      </div>
                      {field.help && <div className="text-[11px]" style={{ color: C.muted }}>{field.help}</div>}
                    </div>
                    <select
                      value={mapping[field.key] ?? -1}
                      onChange={e => setMapping(m => ({ ...m, [field.key]: Number(e.target.value) }))}
                      className="flex-1 border rounded-lg px-2.5 py-2 text-[13px] bg-white"
                      style={{ borderColor: mapping[field.key] >= 0 ? C.border : (field.required ? C.danger : C.border), color: C.ink }}
                    >
                      <option value={-1}>— Skip —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {requiredUnmapped.length > 0 && (
                <p className="text-[12px] flex items-center gap-1.5" style={{ color: C.danger }}>
                  <AlertTriangle size={13} /> Map the required field{requiredUnmapped.length > 1 ? 's' : ''}: {requiredUnmapped.map(f => f.label).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* ── STEP 3: REVIEW / RESULTS ──────────────────────────────── */}
          {step === 'review' && !results && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl px-4 py-3" style={{ background: C.soft }}>
                  <div className="font-display text-[22px] font-semibold" style={{ color: C.success }}>{validCount}</div>
                  <div className="text-[12px]" style={{ color: C.muted }}>ready to import</div>
                </div>
                {skippedCount > 0 && (
                  <div className="flex-1 rounded-xl px-4 py-3" style={{ background: 'rgba(184,66,60,0.07)' }}>
                    <div className="font-display text-[22px] font-semibold" style={{ color: C.danger }}>{skippedCount}</div>
                    <div className="text-[12px]" style={{ color: C.muted }}>will be skipped</div>
                  </div>
                )}
              </div>

              <div className="border rounded-xl overflow-hidden" style={{ borderColor: C.border }}>
                <div className="max-h-[280px] overflow-y-auto">
                  <table className="w-full text-[12.5px]">
                    <thead className="sticky top-0" style={{ background: C.cream }}>
                      <tr>
                        <th className="text-left  text-[10px] uppercase tracking-wider px-3 py-2" style={{ color: C.muted }}>#</th>
                        {entity.fields.filter(f => mapping[f.key] >= 0).slice(0, 3).map(f => (
                          <th key={f.key} className="text-left  text-[10px] uppercase tracking-wider px-3 py-2" style={{ color: C.muted }}>{f.label}</th>
                        ))}
                        <th className="text-left  text-[10px] uppercase tracking-wider px-3 py-2" style={{ color: C.muted }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {built.slice(0, 50).map(r => {
                        const cells = rows[r.index - 1];
                        return (
                          <tr key={r.index} style={{ borderTop: `1px solid ${C.border}` }}>
                            <td className="px-3 py-1.5" style={{ color: C.muted }}>{r.index}</td>
                            {entity.fields.filter(f => mapping[f.key] >= 0).slice(0, 3).map(f => (
                              <td key={f.key} className="px-3 py-1.5 truncate max-w-[140px]" style={{ color: C.ink }}>
                                {cells?.[mapping[f.key]] ?? ''}
                              </td>
                            ))}
                            <td className="px-3 py-1.5">
                              {r.status === 'ok'
                                ? <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: C.success }}><Check size={12} /> OK</span>
                                : <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: C.danger }} title={r.message}><AlertTriangle size={12} /> {r.message}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {built.length > 50 && (
                  <div className="px-3 py-1.5 text-[11px] text-center" style={{ color: C.muted, background: C.cream, borderTop: `1px solid ${C.border}` }}>
                    Showing first 50 of {built.length} rows — all valid rows will be imported.
                  </div>
                )}
              </div>

              {importing && (
                <div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div className="h-full transition-all" style={{ width: `${progress}%`, background: C.forest }} />
                  </div>
                  <p className="text-[11.5px] mt-1.5 text-center" style={{ color: C.muted }}>Importing… {progress}%</p>
                </div>
              )}
            </div>
          )}

          {/* Results summary */}
          {step === 'review' && results && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-12 h-12 rounded-2xl grid place-items-center mb-2"
                  style={{ background: insertedCount > 0 ? C.soft : 'rgba(184,66,60,0.08)' }}>
                  {insertedCount > 0
                    ? <Check size={22} style={{ color: C.success }} />
                    : <AlertTriangle size={22} style={{ color: C.danger }} />}
                </div>
                <div className="font-display text-[18px] font-semibold" style={{ color: C.ink }}>
                  Imported {insertedCount} {insertedCount === 1 ? entity.singular : entity.label}
                </div>
                {failedResults.length > 0 && (
                  <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>
                    {failedResults.length} row{failedResults.length > 1 ? 's' : ''} couldn&apos;t be imported.
                  </p>
                )}
              </div>

              {failedResults.length > 0 && (
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: C.border }}>
                  <div className="px-3 py-2 text-[11px] uppercase tracking-wider" style={{ color: C.muted, background: C.cream }}>
                    Rows to fix
                  </div>
                  <div className="max-h-[220px] overflow-y-auto">
                    {failedResults.map(r => (
                      <div key={r.index} className="flex items-start gap-2 px-3 py-2 text-[12.5px]" style={{ borderTop: `1px solid ${C.border}` }}>
                        <span className=" shrink-0" style={{ color: C.muted }}>Row {r.index}</span>
                        <span style={{ color: C.danger }}>{r.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t shrink-0" style={{ borderColor: C.border }}>
          {!results ? (
            <>
              <button
                onClick={step === 'upload' ? close : () => setStep(step === 'review' ? 'map' : 'upload')}
                disabled={importing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium disabled:opacity-50"
                style={{ color: C.muted }}>
                {step === 'upload' ? 'Cancel' : <><ArrowLeft size={14} /> Back</>}
              </button>

              {step === 'map' && (
                <button
                  onClick={() => setStep('review')}
                  disabled={requiredUnmapped.length > 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-40"
                  style={{ background: C.forest }}>
                  Continue <ArrowRight size={14} />
                </button>
              )}
              {step === 'review' && (
                <button
                  onClick={runImport}
                  disabled={importing || validCount === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-40"
                  style={{ background: C.forest }}>
                  {importing ? <><Loader2 size={14} className="animate-spin" /> Importing…</> : <>Import {validCount} {validCount === 1 ? 'row' : 'rows'}</>}
                </button>
              )}
            </>
          ) : (
            <button onClick={close}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white"
              style={{ background: C.forest }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
