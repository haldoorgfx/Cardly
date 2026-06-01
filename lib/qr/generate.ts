import QRCode from 'qrcode';

export interface QRGenerateOptions {
  token: string;
  eventSlug: string;
  size?: number;
}

export async function generateQRDataUrl(opts: QRGenerateOptions): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
  const url = `${appUrl}/e/${opts.eventSlug}/check-in?token=${opts.token}`;

  return QRCode.toDataURL(url, {
    width: opts.size ?? 300,
    margin: 2,
    color: {
      dark: '#0F1F18',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

export async function generateQRBuffer(opts: QRGenerateOptions): Promise<Buffer> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
  const url = `${appUrl}/e/${opts.eventSlug}/check-in?token=${opts.token}`;

  return QRCode.toBuffer(url, {
    width: opts.size ?? 300,
    margin: 2,
    color: {
      dark: '#0F1F18',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}
