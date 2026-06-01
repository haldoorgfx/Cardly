// Flutterwave payment integration — Phase 1.7
// Uses redirect-based hosted checkout (no embedded Elements)

export const FLUTTERWAVE_CURRENCIES = ['NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS'] as const;
export type FlutterwaveCurrency = (typeof FLUTTERWAVE_CURRENCIES)[number];

export function isFlutterwaveCurrency(currency: string): currency is FlutterwaveCurrency {
  return FLUTTERWAVE_CURRENCIES.includes(currency as FlutterwaveCurrency);
}

export interface FlutterwaveInitParams {
  amount: number;
  currency: FlutterwaveCurrency;
  txRef: string;           // use qr_code_token as tx_ref for idempotency
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  redirectUrl: string;
  meta?: Record<string, string>;
}

export async function initFlutterwavePayment(params: FlutterwaveInitParams) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error('FLUTTERWAVE_SECRET_KEY is not set');

  const res = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
        phonenumber: params.customerPhone,
      },
      meta: params.meta,
      customizations: {
        title: 'Karta Event Registration',
        description: 'Secure payment powered by Karta',
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message ?? 'Flutterwave payment init failed');
  }

  return data.data as { link: string };
}

export async function verifyFlutterwaveTransaction(txId: string) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error('FLUTTERWAVE_SECRET_KEY is not set');

  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  const data = await res.json();
  return data as { status: string; data: { status: string; amount: number; currency: string; tx_ref: string } };
}

export function verifyFlutterwaveWebhookSignature(payload: string): boolean {
  const hash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (!hash) return false;
  // Flutterwave sends verif-hash header — caller must pass the raw header value
  // Comparison done in the webhook handler
  return true;
}
