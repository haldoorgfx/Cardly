'use client';

import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ShieldCheck } from 'lucide-react';

// Initialize outside component to avoid re-creation on re-renders
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface Props {
  clientSecret: string;
  returnUrl: string;
  amount: number;
  currency: string;
  eventTitle: string;
  ticketName: string;
}

export function StripePaymentStep(props: Props) {
  if (!stripePromise) {
    return (
      <div className="rounded-xl p-4 text-[14px]" style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C' }}>
        Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#1F4D3A',
            colorBackground: '#FFFFFF',
            colorText: '#0F1F18',
            colorDanger: '#B8423C',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
            focusBoxShadow: '0 0 0 3px rgba(31,77,58,0.15)',
            focusOutline: 'none',
          },
          rules: {
            '.Input': { border: '1px solid #E5E0D4', padding: '10px 12px', fontSize: '14px' },
            '.Input:focus': { border: '1px solid #E8C57E', boxShadow: '0 0 0 3px rgba(232,197,126,0.15)' },
            '.Label': { fontSize: '12px', fontWeight: '500', color: '#3A4A42', marginBottom: '6px' },
            '.Tab': { border: '1px solid #E5E0D4' },
            '.Tab--selected': { border: '2px solid #1F4D3A', boxShadow: '0 0 0 3px rgba(31,77,58,0.12)' },
          },
        },
      }}
    >
      <InnerForm {...props} />
    </Elements>
  );
}

function InnerForm({ returnUrl, amount, currency, eventTitle, ticketName }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    // If we reach here, payment failed (success causes a redirect)
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
    }
    setProcessing(false);
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency.toUpperCase(),
  }).format(amount);

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <h2 className="font-display font-semibold text-[22px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
          Payment
        </h2>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          {ticketName} · {eventTitle}
        </p>
      </div>

      {/* Amount summary */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
        style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.12)' }}
      >
        <span className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{ticketName}</span>
        <span
          className="text-[17px] font-semibold"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1F4D3A' }}
        >
          {formattedAmount}
        </span>
      </div>

      {/* Stripe Elements */}
      <div className="mb-5">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'google_pay', 'apple_pay'],
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2 px-4 py-3 rounded-xl mb-4 text-[13px]"
          style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.15)' }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full h-12 rounded-xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
        style={{ background: '#1F4D3A' }}
      >
        {processing ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
            </svg>
            Processing…
          </>
        ) : (
          <>Pay {formattedAmount} â†’</>
        )}
      </button>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px]" style={{ color: '#6B7A72' }}>
        <ShieldCheck size={13} strokeWidth={2} />
        Secured by Stripe
      </div>
    </form>
  );
}
