'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageCircle, Plug, Trash2, Plus, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CommsTabs } from '@/components/communications/CommsTabs';
import type { WAConnection, WATemplate, TemplateInput, TemplateCategory } from '@/components/communications/whatsapp-model';

const C = { ink: '#0F1F18', muted: '#6B7A72', border: '#E5E0D4', primary: '#1F4D3A', soft: '#E8EFEB', cream: '#FAF6EE', danger: '#B8423C', warning: '#C97A2D', success: '#2D7A4F', accentDark: '#C9A45E' };

const connectSchema = z.object({
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{6,20}$/, 'Enter a valid number in international format'),
  waba: z.string().trim().max(64, 'WABA id is too long').optional().or(z.literal('')),
});
type ConnectForm = z.infer<typeof connectSchema>;

const tplSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Too long'),
  category: z.enum(['utility', 'marketing', 'authentication']),
  body: z.string().trim().min(1, 'Body is required').max(1024, 'Body is too long'),
});
type TplForm = z.infer<typeof tplSchema>;

const CAT_STYLE: Record<TemplateCategory, { bg: string; fg: string }> = {
  utility: { bg: C.soft, fg: C.primary },
  marketing: { bg: 'rgba(232,197,126,0.22)', fg: '#8A6A28' },
  authentication: { bg: 'rgba(58,107,140,0.12)', fg: '#3A6B8C' },
};
const APPROVAL_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  approved: { bg: C.soft, fg: C.success, label: 'Approved' },
  pending: { bg: 'rgba(201,122,45,0.12)', fg: C.warning, label: 'Pending review' },
  rejected: { bg: '#FBEDEC', fg: C.danger, label: 'Rejected' },
};

interface Props {
  eventSlug: string;
  connections: WAConnection[];
  templates: WATemplate[];
  providerConfigured: boolean;
  connectWhatsApp: (phone: string, waba: string) => Promise<{ ok?: boolean; error?: string }>;
  disconnectWhatsApp: (id: string) => Promise<{ ok?: boolean; error?: string }>;
  createTemplate: (input: TemplateInput) => Promise<{ ok?: boolean; error?: string }>;
}

export function WhatsAppConnectClient({ eventSlug, connections, templates, providerConfigured, connectWhatsApp, disconnectWhatsApp, createTemplate }: Props) {
  const [pending, start] = useTransition();
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [tplOpen, setTplOpen] = useState(false);

  const active = connections.find((c) => c.status !== 'disconnected') ?? null;

  const cf = useForm<ConnectForm>({ resolver: zodResolver(connectSchema), defaultValues: { phone: '', waba: '' } });

  function onConnect(v: ConnectForm) {
    setBanner(null);
    start(async () => {
      const r = await connectWhatsApp(v.phone, v.waba ?? '');
      if (r.error) setBanner({ kind: 'err', text: r.error });
      else { setBanner({ kind: 'ok', text: 'Number saved.' }); cf.reset(); }
    });
  }
  function onDisconnect(id: string) {
    setBanner(null);
    start(async () => {
      const r = await disconnectWhatsApp(id);
      if (r.error) setBanner({ kind: 'err', text: r.error });
      else setBanner({ kind: 'ok', text: 'Number disconnected.' });
    });
  }

  return (
    <div className="min-h-full" style={{ background: C.cream }}>
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-8 pb-24">
        <CommsTabs eventSlug={eventSlug} active="whatsapp" />

        <h1 className="font-display font-semibold text-[24px] sm:text-[28px] leading-tight" style={{ color: C.ink, letterSpacing: '-0.015em' }}>WhatsApp Business</h1>
        <p className="text-[14px] mt-1 mb-5" style={{ color: C.muted }}>Connect a WhatsApp Business number and manage your approved message templates.</p>

        {banner && (
          <div className="mb-5 rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: banner.kind === 'ok' ? C.soft : '#FBEDEC', color: banner.kind === 'ok' ? C.primary : C.danger, border: `1px solid ${banner.kind === 'ok' ? C.border : '#F0CFCD'}` }}>{banner.text}</div>
        )}

        {/* Honesty banner — provider not configured */}
        {!providerConfigured && (
          <div className="mb-5 rounded-xl px-4 py-3.5 flex items-start gap-2.5" style={{ background: 'rgba(201,122,45,0.08)', border: '1px solid rgba(201,122,45,0.3)' }}>
            <AlertTriangle size={16} strokeWidth={2} style={{ color: C.warning, flexShrink: 0, marginTop: 1 }} />
            <p className="text-[12.5px] leading-relaxed" style={{ color: '#5A4520' }}>
              You can save your number and build your template library now, but <strong>outbound WhatsApp sending is not active</strong> — this server has no WhatsApp Business provider configured yet. Broadcasts and journeys will automatically <strong>degrade to email and in-app</strong> until it is.
            </p>
          </div>
        )}

        {/* Connection card */}
        <div className="bg-white rounded-2xl p-5 mb-6" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: C.soft, color: C.primary }}><MessageCircle size={18} strokeWidth={2} /></div>
            <div>
              <div className="text-[15px] font-semibold" style={{ color: C.ink }}>Business number</div>
              <div className="text-[12.5px]" style={{ color: C.muted }}>{active ? 'One number is connected to this event' : 'No number connected yet'}</div>
            </div>
          </div>

          {active ? (
            <div className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: C.cream, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C.ink }}>
                  {active.phone_number}
                  <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10.5px] font-semibold uppercase tracking-wide" style={{ background: C.soft, color: C.success }}><CheckCircle2 size={11} strokeWidth={2.4} /> Saved</span>
                </div>
                {active.waba_id && <div className="text-[12.5px] mt-0.5" style={{ color: C.muted }}>WABA {active.waba_id}</div>}
              </div>
              <button onClick={() => onDisconnect(active.id)} disabled={pending} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium disabled:opacity-50" style={{ background: 'white', color: C.danger, border: `1px solid ${C.border}` }}>
                <Trash2 size={14} strokeWidth={2} /> Disconnect
              </button>
            </div>
          ) : (
            <form onSubmit={cf.handleSubmit(onConnect)} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Phone number *</label>
                <input {...cf.register('phone')} placeholder="+253 77 00 00 00" className="w-full h-10 px-3 rounded-lg text-[14px] outline-none" style={{ border: `1.5px solid ${cf.formState.errors.phone ? C.danger : C.border}`, background: 'white', color: C.ink }} />
                {cf.formState.errors.phone && <p className="text-[12px] mt-1" style={{ color: C.danger }}>{cf.formState.errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>WABA id (optional)</label>
                <input {...cf.register('waba')} placeholder="1029384756" className="w-full h-10 px-3 rounded-lg text-[14px] outline-none" style={{ border: `1.5px solid ${cf.formState.errors.waba ? C.danger : C.border}`, background: 'white', color: C.ink }} />
                {cf.formState.errors.waba && <p className="text-[12px] mt-1" style={{ color: C.danger }}>{cf.formState.errors.waba.message}</p>}
              </div>
              <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13px] font-semibold text-white transition disabled:opacity-60" style={{ background: C.primary }}>
                <Plug size={14} strokeWidth={2} /> {pending ? 'Saving…' : 'Connect number'}
              </button>
            </form>
          )}
        </div>

        {/* Templates */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold" style={{ color: C.ink }}>Message templates</h2>
          <button onClick={() => setTplOpen(true)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium" style={{ color: C.primary, background: 'rgba(31,77,58,0.06)' }}><Plus size={13} strokeWidth={2.5} /> New template</button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center" style={{ border: `1px solid ${C.border}` }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: C.soft, color: C.primary }}><FileText size={22} strokeWidth={1.9} /></div>
            <p className="font-display text-[18px] font-semibold" style={{ color: C.ink }}>No templates yet</p>
            <p className="text-[14px] mt-1.5 mb-5" style={{ color: C.muted }}>WhatsApp requires pre-approved templates for outbound messages. Add your first one to start your library.</p>
            <button onClick={() => setTplOpen(true)} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[14px] font-medium text-white" style={{ background: C.primary }}><Plus size={15} strokeWidth={2.4} /> Add a template</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {templates.map((t) => {
              const cat = CAT_STYLE[t.category];
              const ap = APPROVAL_STYLE[t.approval_status] ?? APPROVAL_STYLE.pending;
              return (
                <div key={t.id} className="bg-white rounded-2xl p-4" style={{ border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[14.5px] font-semibold" style={{ color: C.ink }}>{t.name}</span>
                    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-semibold uppercase tracking-wide" style={{ background: cat.bg, color: cat.fg }}>{t.category}</span>
                    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10.5px] font-semibold" style={{ background: ap.bg, color: ap.fg }}>{ap.label}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>{t.body ? (t.body.length > 160 ? t.body.slice(0, 157) + '…' : t.body) : 'No body set.'}</p>
                </div>
              );
            })}
          </div>
        )}

        {tplOpen && <TemplateModal onClose={() => setTplOpen(false)} onCreate={createTemplate} onDone={(t) => { setTplOpen(false); setBanner({ kind: 'ok', text: t }); }} />}
      </div>
    </div>
  );
}

function TemplateModal({ onClose, onCreate, onDone }: { onClose: () => void; onCreate: (i: TemplateInput) => Promise<{ ok?: boolean; error?: string }>; onDone: (msg: string) => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const f = useForm<TplForm>({ resolver: zodResolver(tplSchema), defaultValues: { name: '', category: 'utility', body: '' } });

  function submit(v: TplForm) {
    setError('');
    start(async () => {
      const r = await onCreate({ name: v.name, category: v.category, body: v.body });
      if (r.error) setError(r.error);
      else onDone('Template added — pending review.');
    });
  }

  return (
    <Modal open onClose={onClose} title="New template" subtitle="Add a message template to your library" maxWidth={520}
      footer={<>
        <button onClick={onClose} className="h-10 px-4 rounded-lg text-[13px] font-medium border" style={{ borderColor: C.border, color: C.muted }}>Cancel</button>
        <button onClick={f.handleSubmit(submit)} disabled={pending} className="h-10 px-5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: C.primary }}>{pending ? 'Saving…' : 'Save template'}</button>
      </>}>
      <div className="space-y-4">
        {error && <div className="px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FBEDEC', color: C.danger, border: '1px solid #F0CFCD' }}>{error}</div>}
        <div>
          <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Name *</label>
          <input {...f.register('name')} autoFocus placeholder="event_reminder_day_before" className="w-full h-10 px-3 rounded-lg text-[14px] outline-none" style={{ border: `1.5px solid ${f.formState.errors.name ? C.danger : C.border}`, background: 'white', color: C.ink }} />
          {f.formState.errors.name && <p className="text-[12px] mt-1" style={{ color: C.danger }}>{f.formState.errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Category *</label>
          <select {...f.register('category')} className="w-full h-10 px-3 rounded-lg text-[14px] outline-none" style={{ border: `1.5px solid ${C.border}`, background: 'white', color: C.ink }}>
            <option value="utility">Utility</option>
            <option value="marketing">Marketing</option>
            <option value="authentication">Authentication</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Body *</label>
          <textarea {...f.register('body')} rows={5} placeholder={'Hi {{1}}, a reminder that {{2}} starts tomorrow at {{3}}.'} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none leading-relaxed" style={{ border: `1.5px solid ${f.formState.errors.body ? C.danger : C.border}`, background: 'white', color: C.ink }} />
          {f.formState.errors.body && <p className="text-[12px] mt-1" style={{ color: C.danger }}>{f.formState.errors.body.message}</p>}
          <p className="text-[11.5px] mt-1" style={{ color: C.muted }}>Use {'{{1}}'}, {'{{2}}'} for variables. New templates start as pending review.</p>
        </div>
      </div>
    </Modal>
  );
}
