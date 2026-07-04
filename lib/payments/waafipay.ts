// WaafiPay — Mobile money gateway for Somalia, Djibouti, Ethiopia
// Supports EVC Plus (Hormuud), eDahab (Telesom), Somtel, e-Maal, etc.
// API: synchronous — response is immediate (no redirect needed)
// Docs: https://docs.waafipay.net

export const WAAFIPAY_CURRENCIES = ['USD', 'SOS', 'DJF'] as const;
export type WaafiPayCurrency = (typeof WAAFIPAY_CURRENCIES)[number];

export const WAAFIPAY_COUNTRY_CODES = [
  { code: '+252', country: 'Somalia', flag: '🇸🇴' },
  { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
] as const;

export function isWaafiPayCurrency(currency: string): currency is WaafiPayCurrency {
  return WAAFIPAY_CURRENCIES.includes(currency as WaafiPayCurrency);
}

export interface WaafiPayChargeParams {
  phoneNumber: string;   // E.164 format, e.g. "+2526xxxxxxx"
  amount: number;
  currency: WaafiPayCurrency | string;
  referenceId: string;   // qr_code_token — used as invoiceId
  description: string;
}

export interface WaafiPayResult {
  success: boolean;
  transactionId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  rawState: string | null;
}

// Endpoints per WaafiPay docs: production api.waafipay.com, sandbox sandbox.waafipay.net.
const WAAFIPAY_API_URL = process.env.NODE_ENV === 'production' && !process.env.WAAFIPAY_SANDBOX
  ? 'https://api.waafipay.com/asm'
  : 'https://sandbox.waafipay.net/asm';

function getCredentials() {
  const merchantUid = process.env.WAAFIPAY_MERCHANT_UID;
  const apiUserId   = process.env.WAAFIPAY_API_USER_ID;
  const apiKey      = process.env.WAAFIPAY_API_KEY;
  if (!merchantUid || !apiUserId || !apiKey) {
    throw new Error('WaafiPay credentials are not configured (WAAFIPAY_MERCHANT_UID, WAAFIPAY_API_USER_ID, WAAFIPAY_API_KEY)');
  }
  return { merchantUid, apiUserId, apiKey };
}

export async function chargeWaafiPay(params: WaafiPayChargeParams): Promise<WaafiPayResult> {
  const { merchantUid, apiUserId, apiKey } = getCredentials();

  const requestId = `${params.referenceId}-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const body = {
    schemaVersion: '1.0',
    requestId,
    timestamp,
    channelName: 'WEB',
    serviceName: 'API_PURCHASE',
    serviceParams: {
      merchantUid,
      apiUserId,
      apiKey,
      paymentMethod: 'MWALLET_ACCOUNT',
      payerInfo: {
        accountNo: params.phoneNumber.replace(/\D/g, ''), // digits only
      },
      transactionInfo: {
        referenceId: params.referenceId,
        invoiceId:   params.referenceId,
        amount:      params.amount,
        currency:    params.currency,
        description: params.description,
      },
    },
  };

  const res = await fetch(WAAFIPAY_API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    return { success: false, transactionId: null, errorCode: `HTTP_${res.status}`, errorMessage: `WaafiPay API returned ${res.status}`, rawState: null };
  }

  const data = await res.json();
  const state       = data?.params?.state ?? data?.responseCode ?? 'UNKNOWN';
  const txnId       = data?.params?.issuer?.TXNID ?? data?.params?.transactionId ?? null;
  const txnStatus   = data?.params?.issuer?.TXNSTATUS ?? state;
  const description = data?.params?.description ?? data?.responseMsg ?? null;

  const isSuccess = ['APPROVED', 'SUCCESS', '2001'].includes(String(txnStatus).toUpperCase());

  return {
    success:      isSuccess,
    transactionId: txnId,
    errorCode:    isSuccess ? null : (data?.responseCode ?? state),
    errorMessage: isSuccess ? null : (description ?? 'Payment declined'),
    rawState:     state,
  };
}

export function verifyWaafiPayWebhook(
  payload: string,
  signature: string | null
): boolean {
  const secret = process.env.WAAFIPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  // WaafiPay signs with HMAC-SHA256 of the payload
  // Verify using Node crypto (called from server-side only)
  try {
    const crypto = require('crypto') as typeof import('crypto'); // eslint-disable-line @typescript-eslint/no-require-imports
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}
