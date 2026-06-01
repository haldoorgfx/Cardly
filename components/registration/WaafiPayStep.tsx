'use client';

import { useState } from 'react';
import { Phone, ShieldCheck, ChevronRight } from 'lucide-react';
import { WAAFIPAY_COUNTRY_CODES } from '@/lib/payments/waafipay';

interface Props {
  registrationId: string;
  qrToken: string;
  amount: number;
  currency: string;
  eventTitle: string;
  ticketName: string;
  onSuccess: (qrToken: string) => void;
}

const OPERATORS = [
  { name: 'Hormuud / EVC Plus', prefix: ['061', '062', '063'] },
  { name: 'Telesom / eDahab',   prefix: ['063', '065'] },
  { name: 'Somtel',             prefix: ['064'] },
  { name: 'Sombank / e-Maal',   prefix: ['066'] },
  { name: 'Djibouti Telecom',   prefix: ['77', '78', '21'] },
];

export function WaafiPayStep({ registrationId, qrToken, amount, currency, eventTitle, ticketName, onSuccess }: Props) {
  const [countryCode, setCountryCode] = useState('+252');
  const [localNumber, setLocalNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const digits = localNumber.replace(/\D/g, '');
  const fullPhone = `${countryCode}${digits}`;
  const isValid = digits.length >= 7 && digits.length <= 10;

  // Detect likely operator from prefix
  const detectedOperator = digits.length >= 2
    ? OPERATORS.find(op => op.prefix.some(p => digits.startsWith(p)))
    : null;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency.toUpperCase(),
    minimumFractionDigits: currency === 'SOS' || currency === 'DJF' ? 0 : 2,
  }).format(amount);

  async function handlePay() {
    if (!isValid) { setError('Enter a valid mobile number'); return; }
    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/payments/waafipay', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ registration_id: registrationId, phone_number: fullPhone }),
      });
      const data = await res.json();

      if (res.ok && (data.status === 'paid' || data.status === 'already_paid')) {
        onSuccess(data.qr_code_token ?? qrToken);
        return;
      }

      const msg = data.detail ?? data.error ?? 'Payment failed. Please try again.';
      setError(
        msg === 'PAYMENT_FAILED' || msg.includes('declined')
          ? 'Payment was declined. Please ensure your mobile money account has sufficient balance and try again.'
          : msg
      );
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display font-semibold text-[22px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
          Pay with mobile money
        </h2>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          {ticketName} · {eventTitle}
        </p>
      </div>

      {/* Amount */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
        style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.12)' }}
      >
        <span className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{ticketName}</span>
        <span
          className="text-[17px] font-semibold"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A' }}
        >
          {formattedAmount}
        </span>
      </div>

      {/* Phone input */}
      <div className="mb-4">
        <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>
          Mobile money number
        </label>
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: '1px solid #E5E0D4', background: 'white' }}
        >
          {/* Country code selector */}
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="h-11 pl-3 pr-2 text-[14px] outline-none shrink-0"
            style={{ background: 'transparent', borderRight: '1px solid #E5E0D4', color: '#0F1F18', minWidth: 90 }}
          >
            {WAAFIPAY_COUNTRY_CODES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>

          {/* Phone icon */}
          <div className="px-2.5 shrink-0" style={{ color: '#6B7A72' }}>
            <Phone size={15} strokeWidth={2} />
          </div>

          {/* Number input */}
          <input
            type="tel"
            inputMode="numeric"
            value={localNumber}
            onChange={e => setLocalNumber(e.target.value)}
            placeholder="61 234 5678"
            className="flex-1 h-11 pr-3 text-[15px] outline-none"
            style={{ color: '#0F1F18', fontFamily: 'JetBrains Mono, monospace', background: 'transparent' }}
          />
        </div>

        {/* Operator hint */}
        {detectedOperator && !error && (
          <p className="text-[12px] mt-1.5 flex items-center gap-1" style={{ color: '#2D7A4F' }}>
            <span>✓</span> Detected: {detectedOperator.name}
          </p>
        )}
        {error && (
          <p className="text-[12px] mt-1.5" style={{ color: '#B8423C' }}>{error}</p>
        )}
      </div>

      {/* Instruction */}
      <div
        className="flex gap-3 px-4 py-3 rounded-xl mb-5 text-[13px]"
        style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
      >
        <span style={{ fontSize: 16 }}>📱</span>
        <div style={{ color: '#3A4A42', lineHeight: 1.5 }}>
          You&apos;ll receive a push notification or USSD prompt on your phone to approve the payment.
          Keep your phone nearby.
        </div>
      </div>

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={processing || !isValid}
        className="w-full h-12 rounded-xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
        style={{ background: '#1F4D3A' }}
      >
        {processing ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
            </svg>
            Waiting for approval…
          </>
        ) : (
          <>
            Pay {formattedAmount}
            <ChevronRight size={16} strokeWidth={2} />
          </>
        )}
      </button>

      {/* Security */}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px]" style={{ color: '#6B7A72' }}>
        <ShieldCheck size={13} strokeWidth={2} />
        Secured by WaafiPay · No card details needed
      </div>

      {/* Supported networks */}
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid #E5E0D4' }}>
        <div className="text-[11px] font-mono uppercase tracking-widest mb-2 text-center" style={{ color: '#6B7A72' }}>
          Supported networks
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {['EVC Plus', 'eDahab', 'Somtel', 'e-Maal', 'D-Money'].map(op => (
            <span
              key={op}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
              style={{ background: '#F5F5F4', color: '#3A4A42', border: '1px solid #E5E0D4' }}
            >
              {op}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
