// Self-contained inline brand logos (official marks + colors). No external
// requests — reliable and offline-safe. Rendered inside a fixed-size tile.

import type { CSSProperties } from 'react';

type LogoProps = { size?: number };

export function SlackLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 122.8 122.8" xmlns="http://www.w3.org/2000/svg" aria-label="Slack">
      <path d="M25.8 77.6a12.9 12.9 0 1 1-12.9-12.9h12.9v12.9z" fill="#E01E5A" />
      <path d="M32.3 77.6a12.9 12.9 0 0 1 25.8 0v32.3a12.9 12.9 0 0 1-25.8 0V77.6z" fill="#E01E5A" />
      <path d="M45.2 25.8a12.9 12.9 0 1 1 12.9-12.9v12.9H45.2z" fill="#36C5F0" />
      <path d="M45.2 32.3a12.9 12.9 0 0 1 0 25.8H12.9a12.9 12.9 0 0 1 0-25.8h32.3z" fill="#36C5F0" />
      <path d="M97 45.2a12.9 12.9 0 1 1 12.9 12.9H97V45.2z" fill="#2EB67D" />
      <path d="M90.5 45.2a12.9 12.9 0 0 1-25.8 0V12.9a12.9 12.9 0 0 1 25.8 0v32.3z" fill="#2EB67D" />
      <path d="M77.6 97a12.9 12.9 0 1 1-12.9 12.9V97h12.9z" fill="#ECB22E" />
      <path d="M77.6 90.5a12.9 12.9 0 0 1 0-25.8h32.3a12.9 12.9 0 0 1 0 25.8H77.6z" fill="#ECB22E" />
    </svg>
  );
}

export function ZapierLogo({ size = 22 }: LogoProps) {
  // Zapier's mark is a 6-point orange asterisk/flower.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Zapier">
      <g stroke="#FF4F00" strokeWidth="3" strokeLinecap="round">
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4.5" y1="7.75" x2="19.5" y2="16.25" />
        <line x1="4.5" y1="16.25" x2="19.5" y2="7.75" />
      </g>
    </svg>
  );
}

export function MailchimpLogo({ size = 22 }: LogoProps) {
  // Cavendish-yellow disc with a simple face (Freddie).
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Mailchimp">
      <circle cx="12" cy="12" r="12" fill="#FFE01B" />
      <circle cx="9.3" cy="10.8" r="1.35" fill="#241C15" />
      <circle cx="14.7" cy="10.8" r="1.35" fill="#241C15" />
      <path d="M8.7 14.8c1.9 1.7 4.7 1.7 6.6 0" stroke="#241C15" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function HubSpotLogo({ size = 22 }: LogoProps) {
  // Official HubSpot sprocket mark.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="HubSpot">
      <path
        d="M18.164 7.93V5.084a2.198 2.198 0 0 0 1.267-1.978v-.067A2.2 2.2 0 0 0 17.238.845h-.067a2.2 2.2 0 0 0-2.193 2.194v.067a2.196 2.196 0 0 0 1.252 1.973l.017.008v2.86a6.22 6.22 0 0 0-2.963 1.302l.02-.016-7.83-6.095A2.49 2.49 0 1 0 3.207 6.62l-.008.003 7.698 5.998a6.19 6.19 0 0 0-1.04 3.446c0 1.328.416 2.558 1.126 3.568l-.013-.02-2.342 2.343a1.98 1.98 0 0 0-.58-.095h-.002a2.033 2.033 0 1 0 2.033 2.033v-.001c0-.204-.032-.4-.09-.585l.004.014 2.317-2.317a6.243 6.243 0 1 0 4.87-11.088l-.058-.006zm-1.166 9.362a3.204 3.204 0 1 1 .002-6.408 3.204 3.204 0 0 1-.002 6.408z"
        fill="#FF7A59"
      />
    </svg>
  );
}

export function GoogleSheetsLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Google Sheets">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill="#0F9D58" />
      <path d="M14.5 2v4a1.5 1.5 0 0 0 1.5 1.5h4L14.5 2z" fill="#0C7C46" />
      <path
        d="M8 11.5h8v6.2H8v-6.2zm1.2 1.2v1.3h2.2v-1.3H9.2zm3.4 0v1.3h2.2v-1.3h-2.2zm-3.4 2.5v1.3h2.2v-1.3H9.2zm3.4 0v1.3h2.2v-1.3h-2.2z"
        fill="#fff"
      />
    </svg>
  );
}

export function StripeLogo({ size = 22 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe">
      <rect width="24" height="24" rx="5" fill="#635BFF" />
      <path
        d="M11.5 9.6c0-.5.4-.7 1-.7.9 0 2 .3 2.9.8V7c-1-.4-1.9-.5-2.9-.5-2.4 0-4 1.2-4 3.3 0 3.2 4.4 2.7 4.4 4.1 0 .5-.5.7-1.1.7-.9 0-2.2-.4-3.2-.9v2.6c1.1.5 2.2.7 3.2.7 2.4 0 4.1-1.2 4.1-3.3 0-3.5-4.4-2.9-4.4-4.1z"
        fill="#fff"
      />
    </svg>
  );
}

const MAP = {
  slack: SlackLogo,
  zapier: ZapierLogo,
  mailchimp: MailchimpLogo,
  hubspot: HubSpotLogo,
  google_sheets: GoogleSheetsLogo,
  stripe: StripeLogo,
} as const;

export type BrandId = keyof typeof MAP;

export function BrandLogo({ id, size = 22, style }: { id: BrandId; size?: number; style?: CSSProperties }) {
  const Logo = MAP[id];
  if (!Logo) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <Logo size={size} />
    </span>
  );
}
