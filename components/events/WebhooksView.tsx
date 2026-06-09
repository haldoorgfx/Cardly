'use client';

import { useState } from 'react';
import { Plug, Plus, Key, CheckCircle2, XCircle, X } from 'lucide-react';

interface Props {
  eventId: string;
  eventName: string;
}

type Endpoint = {
  url: string;
  events: string;
  lastDelivery: string;
  status: 'Active' | 'Failing';
};

type Delivery = {
  event: string;
  response: '200' | '500';
  when: string;
};

const INITIAL_ENDPOINTS: Endpoint[] = [
  { url: 'https://api.acme.com/karta/webhook', events: 'registration.created, checkin.*', lastDelivery: '200 · 2m ago', status: 'Active' },
  { url: 'https://hooks.zapier.com/hooks/abc123', events: 'card.shared', lastDelivery: '200 · 1h ago', status: 'Active' },
  { url: 'https://crm.partner.io/ingest', events: 'registration.*', lastDelivery: '500 · 3h ago', status: 'Failing' },
];

const SAMPLE_DELIVERIES: Delivery[] = [
  { event: 'registration.created', response: '200', when: '2 min ago' },
  { event: 'checkin.completed',    response: '200', when: '8 min ago' },
  { event: 'card.shared',          response: '200', when: '14 min ago' },
  { event: 'registration.created', response: '500', when: '3 hr ago'  },
];

const ALL_EVENTS = [
  'registration.created',
  'registration.updated',
  'checkin.completed',
  'card.shared',
  'order.completed',
  'ticket.cancelled',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function WebhooksView(_props: Props) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(INITIAL_ENDPOINTS);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['registration.created']);
  const [urlError, setUrlError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleEvent(ev: string) {
    setSelectedEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    );
  }

  function openModal() {
    setUrl('');
    setSelectedEvents(['registration.created']);
    setUrlError('');
    setSaved(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) { setUrlError('URL is required'); return; }
    try { new URL(trimmed); } catch { setUrlError('Enter a valid URL (e.g. https://your-server.com/webhook)'); return; }
    if (selectedEvents.length === 0) { setUrlError('Select at least one event type'); return; }
    setUrlError('');
    setSaving(true);
    // Simulate save — in future this will POST to /api/events/[id]/webhooks
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setEndpoints(prev => [{
      url: trimmed,
      events: selectedEvents.join(', '),
      lastDelivery: '—',
      status: 'Active',
    }, ...prev]);
    setTimeout(() => setShowModal(false), 800);
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Webhooks
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
            Receive real-time event notifications
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add endpoint
        </button>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-7 text-[12.5px]"
        style={{ background: '#F5F7F5', border: '1px solid #E5E0D4' }}
      >
        <Key size={14} strokeWidth={2} style={{ color: '#1F4D3A', flexShrink: 0, marginTop: 1 }} />
        <span style={{ color: '#3A4A42' }}>
          Keep your keys secret. Use them in the{' '}
          <code className="px-1 py-0.5 rounded text-[11px]" style={{ background: '#EDE9E0', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Authorization: Bearer
          </code>{' '}
          header. Rotate immediately if exposed.
        </span>
      </div>

      {/* Endpoints */}
      <h2 className="text-[11px] font-semibold mb-3" style={{ color: '#6B7A72', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Endpoints
      </h2>
      <div className="space-y-2.5 mb-7">
        {endpoints.map((ep, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{ background: 'white', border: '1px solid #E5E0D4' }}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: ep.status === 'Active' ? 'rgba(31,77,58,0.08)' : 'rgba(184,66,60,0.08)',
              }}
            >
              <Plug size={15} strokeWidth={2} style={{ color: ep.status === 'Active' ? '#1F4D3A' : '#B8423C' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-mono truncate" style={{ color: '#0F1F18' }}>{ep.url}</p>
              <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: '#6B7A72' }}>{ep.events}</p>
            </div>
            <span className="text-[11px] font-mono hidden sm:block" style={{ color: '#6B7A72' }}>{ep.lastDelivery}</span>
            <StatusPill status={ep.status} />
          </div>
        ))}
      </div>

      {/* Recent deliveries */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', background: 'white' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <h2 className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>Recent deliveries</h2>
        </div>
        {/* Table head */}
        <div
          className="grid px-5 py-2.5"
          style={{ gridTemplateColumns: '1fr 80px 120px', borderBottom: '1px solid #E5E0D4', background: '#FAFAF8' }}
        >
          {['Event', 'Response', 'When'].map(h => (
            <span key={h} className="text-[11px] font-medium" style={{ color: '#6B7A72', letterSpacing: '0.03em' }}>{h}</span>
          ))}
        </div>
        {SAMPLE_DELIVERIES.map((d, i) => (
          <div
            key={i}
            className="grid items-center px-5 py-3"
            style={{
              gridTemplateColumns: '1fr 80px 120px',
              borderBottom: i < SAMPLE_DELIVERIES.length - 1 ? '1px solid #F5F0E8' : 'none',
            }}
          >
            <span className="text-[12.5px] font-mono" style={{ color: '#0F1F18' }}>{d.event}</span>
            <div>
              <span
                className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-mono font-medium"
                style={{
                  background: d.response === '200' ? 'rgba(45,122,79,0.1)' : 'rgba(184,66,60,0.1)',
                  color: d.response === '200' ? '#2D7A4F' : '#B8423C',
                }}
              >
                {d.response === '200'
                  ? <CheckCircle2 size={10} strokeWidth={2.5} />
                  : <XCircle size={10} strokeWidth={2.5} />
                }
                {d.response}
              </span>
            </div>
            <span className="text-[12px] font-mono" style={{ color: '#6B7A72' }}>{d.when}</span>
          </div>
        ))}
      </div>

      {/* Add endpoint modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,31,24,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-[480px] rounded-2xl shadow-xl"
            style={{ background: 'white', border: '1px solid #E5E0D4' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #E5E0D4' }}>
              <h2 className="font-display font-semibold text-[17px]" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                Add webhook endpoint
              </h2>
              <button
                onClick={closeModal}
                className="h-7 w-7 rounded-lg flex items-center justify-center transition hover:bg-[#FAF6EE]"
                style={{ color: '#6B7A72' }}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
              {/* URL */}
              <div>
                <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: '#0F1F18' }}>
                  Endpoint URL <span style={{ color: '#B8423C' }}>*</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setUrlError(''); }}
                  placeholder="https://your-server.com/webhook"
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none transition"
                  style={{
                    border: urlError ? '1.5px solid #B8423C' : '1.5px solid #E5E0D4',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: '#0F1F18',
                  }}
                  onFocus={e => { if (!urlError) e.currentTarget.style.borderColor = '#1F4D3A'; }}
                  onBlur={e => { if (!urlError) e.currentTarget.style.borderColor = '#E5E0D4'; }}
                />
                {urlError && (
                  <p className="text-[11.5px] mt-1.5" style={{ color: '#B8423C' }}>{urlError}</p>
                )}
              </div>

              {/* Event types */}
              <div>
                <label className="block text-[12.5px] font-medium mb-2" style={{ color: '#0F1F18' }}>
                  Event types
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_EVENTS.map(ev => (
                    <label
                      key={ev}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition"
                      style={{
                        border: `1.5px solid ${selectedEvents.includes(ev) ? '#1F4D3A' : '#E5E0D4'}`,
                        background: selectedEvents.includes(ev) ? 'rgba(31,77,58,0.06)' : 'white',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev)}
                        onChange={() => toggleEvent(ev)}
                        className="sr-only"
                      />
                      <div
                        className="h-3.5 w-3.5 rounded flex items-center justify-center shrink-0"
                        style={{
                          border: `1.5px solid ${selectedEvents.includes(ev) ? '#1F4D3A' : '#C9C3B1'}`,
                          background: selectedEvents.includes(ev) ? '#1F4D3A' : 'white',
                        }}
                      >
                        {selectedEvents.includes(ev) && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] font-mono" style={{ color: selectedEvents.includes(ev) ? '#1F4D3A' : '#3A4A42' }}>
                        {ev}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #E5E0D4' }}>
              <button
                onClick={closeModal}
                className="h-9 px-4 rounded-xl text-[13px] font-medium transition hover:bg-[#FAF6EE]"
                style={{ border: '1px solid #E5E0D4', color: '#3A4A42' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: saved ? '#2D7A4F' : '#1F4D3A', minWidth: 120 }}
              >
                {saved ? 'âœ" Saved' : saving ? 'Saving…' : 'Add endpoint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: 'Active' | 'Failing' }) {
  return (
    <span
      className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium shrink-0"
      style={status === 'Active'
        ? { background: 'rgba(45,122,79,0.1)', color: '#2D7A4F' }
        : { background: 'rgba(184,66,60,0.1)', color: '#B8423C' }
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: status === 'Active' ? '#2D7A4F' : '#B8423C' }} />
      {status}
    </span>
  );
}
