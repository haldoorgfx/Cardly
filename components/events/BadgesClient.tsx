'use client';

import { useState } from 'react';
import { PageShell, PageHeader } from '@/components/dash';

interface TicketType { id: string; name: string; }

interface Props {
  eventId: string;
  eventName: string;
  ticketTypes: TicketType[];
  regCount: number;
}

const VARIANTS = [
  { id: 'attendee', label: 'Attendee',  strip: '#1F4D3A' },
  { id: 'speaker',  label: 'Speaker',   strip: '#E8C57E' },
  { id: 'vip',      label: 'VIP',       strip: '#3A6B8C' },
  { id: 'staff',    label: 'Staff',     strip: '#65736B' },
];

const TOGGLE_OPTIONS = [
  { id: 'photo',   label: 'Photo' },
  { id: 'qr',      label: 'QR code' },
  { id: 'company', label: 'Company' },
  { id: 'strip',   label: 'Color strip' },
];

const SIZES = ['A4', 'A6', 'Letter', '4×6 in'];

export function BadgesClient({ eventName, ticketTypes, regCount }: Props) {
  const [variant, setVariant] = useState('attendee');
  const [elements, setElements] = useState({ photo: true, qr: true, company: true, strip: true });
  const [size, setSize] = useState('A6');
  const [printing, setPrinting] = useState(false);

  function toggleEl(id: keyof typeof elements) {
    setElements(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const strip = VARIANTS.find(v => v.id === variant)?.strip ?? '#1F4D3A';

  async function bulkPrint() {
    setPrinting(true);
    await new Promise(r => setTimeout(r, 1200));
    setPrinting(false);
  }

  return (
    <PageShell width="wide">
      <PageHeader
        title="Badges"
        subtitle={`Badge designer & bulk print · ${eventName}`}
        actions={
          <button onClick={bulkPrint} disabled={printing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13.5px] font-medium text-cream transition-opacity"
            style={{ background: '#1F4D3A', opacity: printing ? 0.7 : 1 }}>
            <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.75 18m10.56-4.171l-.405 4.172M19.5 9V6.75A2.25 2.25 0 0017.25 4.5H6.75A2.25 2.25 0 004.5 6.75V9m15 0H4.5m15 0v5.25A2.25 2.25 0 0117.25 21H6.75A2.25 2.25 0 014.5 18.75V9" />
            </svg>
            {printing ? 'Preparing…' : `Print all ${regCount}`}
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Confirmed', value: regCount },
          { label: 'Ticket types', value: ticketTypes.length },
          { label: 'Badge size', value: size },
          { label: 'Printed', value: '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className=" text-[11.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#65736B' }}>{s.label}</div>
            <div className=" text-[24px] leading-none" style={{ color: '#0F1F18' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Controls */}
        <div className="grid gap-5 content-start">
          {/* Variant */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className=" text-[11.5px] tracking-[0.14em] uppercase mb-3" style={{ color: '#65736B' }}>Badge variant</div>
            <div className="grid grid-cols-2 gap-2">
              {VARIANTS.map(v => (
                <button key={v.id} onClick={() => setVariant(v.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all"
                  style={{
                    borderColor: variant === v.id ? v.strip : '#E5E0D4',
                    background: variant === v.id ? `${v.strip}14` : 'white',
                    color: variant === v.id ? v.strip : '#3A4A42',
                  }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: v.strip }} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Elements */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className=" text-[11.5px] tracking-[0.14em] uppercase mb-3" style={{ color: '#65736B' }}>Elements</div>
            <div className="grid gap-3">
              {TOGGLE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center justify-between">
                  <span className="text-[13.5px]" style={{ color: '#0F1F18' }}>{opt.label}</span>
                  <button
                    onClick={() => toggleEl(opt.id as keyof typeof elements)}
                    className="relative w-9 h-5 rounded-full transition-colors"
                    style={{ background: elements[opt.id as keyof typeof elements] ? '#1F4D3A' : '#E5E0D4' }}>
                    <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ transform: elements[opt.id as keyof typeof elements] ? 'translateX(16px)' : 'translateX(0)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Paper / printer */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className=" text-[11.5px] tracking-[0.14em] uppercase mb-3" style={{ color: '#65736B' }}>Paper size</div>
            <div className="grid grid-cols-2 gap-2">
              {SIZES.map(s => (
                <button key={s} onClick={() => setSize(s)}
                  className="px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all"
                  style={{
                    borderColor: size === s ? '#1F4D3A' : '#E5E0D4',
                    background: size === s ? '#E8EFEB' : 'white',
                    color: size === s ? '#1F4D3A' : '#3A4A42',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center min-h-[500px]"
          style={{ border: '1px solid #E5E0D4', background: '#FAF6EE' }}>
          <div className=" text-[11.5px] tracking-[0.14em] uppercase mb-6" style={{ color: '#65736B' }}>Live preview</div>

          {/* Badge card */}
          <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden" style={{ width: 240, minHeight: 320 }}>
            {/* Color strip */}
            {elements.strip && <div className="absolute top-0 left-0 right-0 h-3" style={{ background: strip }} />}

            <div className={`flex flex-col items-center px-5 pb-5 ${elements.strip ? 'pt-8' : 'pt-5'}`}>
              {/* Photo */}
              {elements.photo && (
                <div className="w-20 h-20 rounded-full mb-3 grid place-items-center"
                  style={{ background: `${strip}22`, border: `3px solid ${strip}33` }}>
                  <svg width={28} height={28} fill="none" stroke={strip} strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}

              {/* Name */}
              <div className="font-display font-semibold text-[17px] text-center" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                Attendee Name
              </div>

              {/* Company */}
              {elements.company && (
                <div className="text-[12px] mt-1 text-center" style={{ color: '#65736B' }}>Organization</div>
              )}

              {/* Badge type label */}
              <div className="mt-3 px-3 py-1 rounded-full  text-[12px] tracking-[0.12em] uppercase"
                style={{ background: `${strip}18`, color: strip }}>
                {VARIANTS.find(v => v.id === variant)?.label}
              </div>

              {/* QR */}
              {elements.qr && (
                <div className="mt-4 rounded-lg p-2" style={{ background: '#F5F3EE', border: '1px solid #E5E0D4' }}>
                  {/* Mini QR placeholder grid */}
                  <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(6, 8px)' }}>
                    {Array.from({ length: 36 }, (_, i) => (
                      <div key={i} className="w-2 h-2 rounded-[1px]"
                        style={{ background: ((i * 7 + Math.floor(i / 6) * 3) % 3 === 0) ? '#0F1F18' : 'white' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className=" text-[12px] mt-4" style={{ color: '#9BA8A1' }}>
            {size} · {VARIANTS.find(v => v.id === variant)?.label} variant
          </p>
        </div>
      </div>
    </PageShell>
  );
}
