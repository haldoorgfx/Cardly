import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Eventera collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <section className="max-w-[820px] mx-auto px-6 pt-20 pb-28">
        <div className="text-[11px] tracking-[0.18em] text-brand-primary mb-4">
          LEGAL
        </div>
        <h1 className="font-title font-bold text-[40px] sm:text-[48px] leading-[1.05] mb-3">
          Privacy Policy
        </h1>
        <p className="text-[13px] text-brand-ink/45 mb-10">
          Last updated: May 2026
        </p>

        <div className="space-y-10 text-[16px] text-brand-ink/75 leading-[1.8]">
          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              What we collect
            </h2>
            <p className="mb-3">When you create an account:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>Your email address</li>
              <li>Your name (optional, if you add it to your profile)</li>
            </ul>

            <p className="mt-4 mb-3">When you create an event:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>
                The design image you upload (stored in Supabase cloud storage)
              </li>
              <li>The zone configuration you define (stored in our database)</li>
              <li>Your event name and settings</li>
            </ul>

            <p className="mt-4 mb-3">
              When an attendee fills out your event card:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>
                The name, title, company, and any other text fields you defined
              </li>
              <li>
                The photo they upload (if your design includes a photo zone)
              </li>
              <li>The generated card image (the personalized PNG output)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              How we use it
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>To provide the card generation service</li>
              <li>To store your events and let you manage them</li>
              <li>
                To show you how many cards have been generated for each event
              </li>
            </ul>
            <p className="mt-4">
              We do not sell your data or attendee data to third parties. We do
              not use attendee data for marketing. We do not share your design
              files with anyone other than you.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Where data is stored
            </h2>
            <p>
              We use Supabase for our database and file storage. Files are
              stored in Supabase&apos;s cloud infrastructure. Your account data
              lives in a Supabase database. You can read Supabase&apos;s own
              privacy policy at supabase.com/privacy.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Cookies
            </h2>
            <p>
              We use a required cookie to keep you signed in. With your consent
              (via the cookie banner), we also use privacy-conscious analytics and
              support tools to improve Eventera:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li><strong>PostHog</strong> — product analytics and session replay (inputs are masked; we never record passwords or payment fields). Loads only if you accept.</li>
              <li><strong>Crisp</strong> — the live support chat widget. Loads only if you accept.</li>
              <li><strong>Sentry</strong> — error monitoring, so we can fix crashes.</li>
              <li><strong>Vercel Analytics</strong> — aggregate, cookieless traffic measurement.</li>
            </ul>
            <p className="mt-3">
              We do not run Google Analytics, Facebook Pixel, or advertising
              cookies. You can reject the optional tools from the cookie banner.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Attendee data retention
            </h2>
            <p>
              Attendee names, photos, and generated cards are stored as long as
              the event exists in your account. When you delete an event, all
              associated attendee data and generated cards are deleted too.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Your rights
            </h2>
            <p>
              You can delete your account at any time. When you delete your
              account, all your events, design files, and associated attendee
              data are permanently removed. If you want to delete only specific
              events, you can do that from the dashboard.
            </p>
            <p className="mt-3">
              If you are an attendee who submitted data through an Eventera event
              and want that data removed, email us at hello@eventera.so with the
              event name.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Contact
            </h2>
            <p>
              Privacy questions:{" "}
              <a
                href="mailto:hello@eventera.so"
                className="text-brand-primary hover:underline"
              >
                hello@eventera.so
              </a>
              . We&apos;re a small team and we reply to every message.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
