'use client';

import { fmtPrice } from './walkInFormat';

interface Ticket { id: string; name: string; price: number; currency: string; quantity: number | null; }

interface Props {
  tickets: Ticket[];
  ticketId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function WalkInTicketStep({ tickets, ticketId, onSelect, onBack, onContinue }: Props) {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h2 className="font-display font-semibold text-[20px] mb-6" style={{ color: '#FAF6EE' }}>Select ticket</h2>
      {tickets.length === 0 ? (
        <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.5)' }}>No tickets available</p>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className="w-full text-left px-4 py-4 rounded-xl transition"
              style={{
                background: ticketId === t.id ? 'rgba(232,197,126,0.12)' : 'rgba(255,255,255,0.04)',
                border: ticketId === t.id ? '1px solid rgba(232,197,126,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: '#FAF6EE' }}>{t.name}</div>
                  {t.quantity != null && t.quantity > 0 && <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.quantity} available</div>}
                </div>
                <div className="text-[18px] font-bold" style={{ color: ticketId === t.id ? '#E8C57E' : 'rgba(255,255,255,0.7)' }}>
                  {fmtPrice(t.price, t.currency || 'USD')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold border transition hover:opacity-70" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
          Back
        </button>
        <button type="button" onClick={onContinue} disabled={!ticketId} className="flex-1 py-3 rounded-2xl text-[15px] font-semibold transition hover:opacity-90 disabled:opacity-40" style={{ background: '#E8C57E', color: '#0F1F18' }}>
          Continue
        </button>
      </div>
    </div>
  );
}
