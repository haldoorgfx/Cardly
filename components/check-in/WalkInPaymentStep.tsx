'use client';

import { fmtPrice } from './walkInFormat';

export type PaymentMethod = 'cash' | 'mobile_money' | 'card';

interface Ticket { id: string; name: string; price: number; currency: string; quantity: number | null; }

interface Props {
  selectedTicket: Ticket | undefined;
  attendeeName: string;
  attendeeEmail: string;
  payment: PaymentMethod;
  amountReceived: string;
  onSelectMethod: (m: PaymentMethod) => void;
  onAmountReceivedChange: (v: string) => void;
  submitError: string | null;
  submitting: boolean;
  isFull: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

const METHODS: { id: PaymentMethod; label: string; sub: string }[] = [
  { id: 'cash', label: 'Cash', sub: 'At the door' },
  { id: 'mobile_money', label: 'Mobile money', sub: 'Transfer' },
  { id: 'card', label: 'Card', sub: 'Tap to pay' },
];

export function WalkInPaymentStep({
  selectedTicket, attendeeName, attendeeEmail, payment, amountReceived,
  onSelectMethod, onAmountReceivedChange, submitError, submitting, isFull, onBack, onSubmit,
}: Props) {
  const price = selectedTicket?.price ?? 0;
  const currency = selectedTicket?.currency || 'USD';
  const isPaid = price > 0;

  // The typed "amount received" is UI-only — it computes change for the human.
  // It is NEVER sent as amount_paid; the server records the ticket price.
  const receivedNum = parseFloat(amountReceived);
  const hasReceived = amountReceived.trim() !== '' && !Number.isNaN(receivedNum);
  const change = hasReceived ? receivedNum - price : 0;
  const cashShort = payment === 'cash' && isPaid && (!hasReceived || receivedNum < price);
  const submitDisabled = submitting || isFull || cashShort;

  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h2 className="font-display font-semibold text-[20px] mb-6" style={{ color: '#FAF6EE' }}>Payment</h2>

      {/* Summary */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedTicket?.name ?? 'General'}</span>
          <span className="text-[16px] font-semibold" style={{ color: '#FAF6EE' }}>{fmtPrice(price, currency)}</span>
        </div>
        <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{attendeeName} · {attendeeEmail}</div>
      </div>

      {isPaid && (
        <>
          {/* Payment method */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {METHODS.map(opt => (
              <button key={opt.id} type="button" onClick={() => onSelectMethod(opt.id)}
                className="py-3.5 px-2 rounded-xl transition text-center"
                style={{
                  background: payment === opt.id ? 'rgba(232,197,126,0.12)' : 'rgba(255,255,255,0.04)',
                  border: payment === opt.id ? '1px solid rgba(232,197,126,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="text-[14px] font-semibold" style={{ color: '#FAF6EE' }}>{opt.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{opt.sub}</div>
              </button>
            ))}
          </div>

          {/* Cash: amount received + live change due */}
          {payment === 'cash' && (
            <div className="mb-6">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Amount received
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={amountReceived}
                onChange={e => onAmountReceivedChange(e.target.value)}
                placeholder={String(price)}
                className="w-full px-4 py-3 rounded-xl text-[18px] font-semibold outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAF6EE' }}
                onFocus={e => e.currentTarget.style.borderColor = '#E8C57E'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />

              <div className="mt-4 rounded-xl p-4 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {cashShort ? (
                  <>
                    <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Still needed</span>
                    <span className="font-display font-bold text-[26px]" style={{ color: '#C97A2D', letterSpacing: '-0.01em' }}>
                      {hasReceived ? fmtPrice(price - receivedNum, currency) : fmtPrice(price, currency)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Change due</span>
                    <span className="font-display font-bold text-[32px]" style={{ color: '#E8C57E', letterSpacing: '-0.01em' }}>
                      {fmtPrice(change, currency)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {submitError && (
        <div className="mb-4 px-3 py-2.5 rounded-xl text-[13px]" style={{ background: 'rgba(184,66,60,0.15)', border: '1px solid rgba(184,66,60,0.3)', color: '#ff8080' }}>
          {submitError}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-2xl text-[14px] font-semibold border transition hover:opacity-70" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
          Back
        </button>
        <button type="button" onClick={onSubmit} disabled={submitDisabled} className="flex-1 py-3 rounded-2xl text-[15px] font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ background: '#E8C57E', color: '#0F1F18' }}>
          {submitting ? 'Registering…' : 'Register & check in'}
        </button>
      </div>
    </div>
  );
}
