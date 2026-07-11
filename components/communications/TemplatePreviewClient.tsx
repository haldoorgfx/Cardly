'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCheck, FileText } from 'lucide-react';
import { CommsTabs } from '@/components/communications/CommsTabs';
import type { WATemplate } from '@/components/communications/whatsapp-model';

const C = { ink: '#0F1F18', muted: '#6B7A72', border: '#E5E0D4', primary: '#1F4D3A', soft: '#E8EFEB', cream: '#FAF6EE', surface: '#FFFFFF' };

/** Extract the {{n}} variable indices from a template body, in order, deduped. */
function extractVars(body: string): string[] {
  const found: string[] = [];
  const re = /\{\{\s*([\w]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (!found.includes(m[1])) found.push(m[1]);
  }
  return found;
}

function render(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_all, key: string) => {
    const v = values[key];
    return v && v.trim() ? v : `{{${key}}}`;
  });
}

const SAMPLES = ['Amina', 'Djibouti Tech Summit', 'Fri 18 Jul, 9:00', 'Kempinski Hotel', 'eventera.so/e/dts'];

interface Props {
  eventSlug: string;
  eventName: string;
  templates: WATemplate[];
}

export function TemplatePreviewClient({ eventSlug, eventName, templates }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const selected = templates.find((t) => t.id === selectedId) ?? null;
  const body = selected?.body ?? '';

  const vars = useMemo(() => extractVars(body), [body]);
  const [values, setValues] = useState<Record<string, string>>({});

  const sample = useMemo(() => {
    const filled: Record<string, string> = {};
    vars.forEach((v, i) => { filled[v] = values[v] ?? SAMPLES[i % SAMPLES.length]; });
    return filled;
  }, [vars, values]);

  const rendered = selected ? render(body, sample) : '';
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-full" style={{ background: C.cream }}>
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-8 pb-24">
        <CommsTabs eventSlug={eventSlug} active="preview" />

        <h1 className="font-display font-semibold text-[24px] sm:text-[28px] leading-tight" style={{ color: C.ink, letterSpacing: '-0.015em' }}>Template preview</h1>
        <p className="text-[14px] mt-1 mb-5" style={{ color: C.muted }}>See how a template looks with sample values. This is a read-only preview — it doesn&apos;t send anything.</p>

        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center" style={{ border: `1px solid ${C.border}` }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: C.soft, color: C.primary }}><FileText size={22} strokeWidth={1.9} /></div>
            <p className="font-display text-[18px] font-semibold" style={{ color: C.ink }}>No templates to preview</p>
            <p className="text-[14px] mt-1.5 mb-5" style={{ color: C.muted }}>Create a template first, then come back to preview it.</p>
            <Link href={`/events/${eventSlug}/communications/whatsapp`} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[14px] font-medium text-white" style={{ background: C.primary }}>Add a template</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Controls */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Template</label>
              <select value={selectedId ?? ''} onChange={(e) => { setSelectedId(e.target.value); setValues({}); }} className="w-full h-10 px-3 rounded-lg text-[14px] outline-none mb-5" style={{ border: `1px solid ${C.border}`, background: 'white', color: C.ink }}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              {vars.length > 0 ? (
                <>
                  <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.muted }}>Sample values</div>
                  <div className="space-y-3">
                    {vars.map((v, i) => (
                      <div key={v}>
                        <label className="block text-[12px] mb-1" style={{ color: C.ink }}>Variable {'{{'}{v}{'}}'}</label>
                        <input value={values[v] ?? ''} onChange={(e) => setValues((p) => ({ ...p, [v]: e.target.value }))} placeholder={SAMPLES[i % SAMPLES.length]} className="w-full h-9 px-3 rounded-lg text-[13.5px] outline-none" style={{ border: `1px solid ${C.border}`, background: 'white', color: C.ink }} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[13px]" style={{ color: C.muted }}>This template has no variables.</p>
              )}
            </div>

            {/* WhatsApp-ish bubble */}
            <div className="rounded-2xl p-5 flex flex-col items-center justify-center" style={{ background: '#EAE6DC', border: `1px solid ${C.border}` }}>
              <div className="w-full max-w-[320px]">
                <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm" style={{ background: C.surface }}>
                  <div className="text-[10.5px] font-semibold mb-1" style={{ color: C.primary }}>{eventName}</div>
                  <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: C.ink }}>{rendered || 'Empty template'}</div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px]" style={{ color: C.muted }}>{now}</span>
                    <CheckCheck size={13} strokeWidth={2} style={{ color: '#3A6B8C' }} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 justify-center">
                  <Check size={11} strokeWidth={2} style={{ color: C.muted }} />
                  <span className="text-[10.5px]" style={{ color: C.muted }}>Preview only — nothing is sent</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
