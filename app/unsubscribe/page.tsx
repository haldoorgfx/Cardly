import type { Metadata } from 'next';
import { readUnsubscribeToken } from '@/lib/email/unsubscribe';
import UnsubscribeForm from './UnsubscribeForm';

export const metadata: Metadata = {
  title: 'Unsubscribe · Eventera',
  // Never let an unsubscribe URL (which contains a signed token tied to a real
  // email address) end up in a search index.
  robots: { index: false, follow: false },
};

// The opt-out is recorded by a POST, never by loading this page. Corporate mail
// scanners and link-preview bots fetch every URL in an inbound email — doing
// the work on GET would silently unsubscribe people who never clicked.
export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? '';
  const parsed = token ? readUnsubscribeToken(token) : null;

  return (
    <main className="min-h-screen px-4 py-12 sm:py-20" style={{ background: '#FAF6EE' }}>
      <div
        className="mx-auto w-full max-w-[520px] rounded-2xl p-6 sm:p-8"
        style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
      >
        {parsed ? (
          <UnsubscribeForm token={token} email={parsed.email} />
        ) : (
          <div>
            <h1
              className="text-[22px] sm:text-[26px] font-bold mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em', color: '#0F1F18' }}
            >
              This link isn&apos;t valid
            </h1>
            <p className="text-[15px] leading-relaxed" style={{ color: '#3A4A42' }}>
              The unsubscribe link looks incomplete or has been changed. Open the link directly
              from the email you received, or reply to that email and we&apos;ll remove you
              manually.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
