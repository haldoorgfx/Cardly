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
          Last updated: July 2026
        </p>

        <div className="space-y-10 text-[16px] text-brand-ink/75 leading-[1.8]">
          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              What we collect
            </h2>
            <p className="mb-3">When you create an account:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>Your email address</li>
              <li>Your name and profile details (title, organization, photo — optional)</li>
              <li>Your role on the platform (attendee, organizer, speaker, sponsor, exhibitor)</li>
            </ul>

            <p className="mt-4 mb-3">When you create or manage an event as an organizer:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>Your event details — name, description, dates, venue, cover image</li>
              <li>Agenda, sessions, speaker, and sponsor information you add</li>
              <li>Ticket types, pricing, and promo codes you configure</li>
              <li>Your Eventera Card design and zone configuration</li>
              <li>Analytics about your event (registrations, revenue, check-ins)</li>
            </ul>

            <p className="mt-4 mb-3">When you register for an event as an attendee:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>Your name, email, phone number, and any custom registration-form answers the organizer requests</li>
              <li>Your ticket type and payment status (not your full card number — see &ldquo;Payments&rdquo; below)</li>
              <li>The photo you upload for your Eventera Card, if the event uses one</li>
              <li>Your generated Eventera Card (the personalized image output)</li>
              <li>Check-in status and time, if you attend in person and are scanned at the door</li>
              <li>Networking, messaging, or agenda-building activity, if you use those features for an event</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              How we use it
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>To run registration, ticketing, and check-in for events</li>
              <li>To generate and deliver Eventera Cards</li>
              <li>To let organizers manage their events and see analytics about them</li>
              <li>To send transactional emails and notifications (registration confirmations, reminders, updates about an event you registered for)</li>
              <li>To process payments for paid tickets, through our payment processors</li>
              <li>To power optional AI features (ERA and AI Copilot), when an organizer chooses to use them</li>
            </ul>
            <p className="mt-4">
              We do not sell your data or attendee data to third parties. We do
              not use attendee data for marketing outside the event you
              registered for. We do not share your event content or card
              designs with anyone beyond what&apos;s needed to run the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Payments
            </h2>
            <p>
              Paid registrations are processed by Stripe, Flutterwave, or
              WaafiPay, depending on the event&apos;s region. We do not store
              your full card number — that is handled directly by the payment
              processor. We receive confirmation that a payment succeeded, the
              amount, and enough information to reconcile it with your
              registration.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Who we share data with
            </h2>
            <p className="mb-3">
              We use a small set of service providers (subprocessors) to run
              Eventera. Each only receives the data it needs to do its job:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li><strong>Supabase</strong> — our database and file storage.</li>
              <li><strong>Stripe, Flutterwave, WaafiPay</strong> — payment processing for paid tickets.</li>
              <li><strong>Resend</strong> — delivery of transactional emails.</li>
              <li><strong>Firebase Cloud Messaging</strong> — mobile push notifications, for users of the Eventera app.</li>
              <li><strong>Google Gemini and Anthropic Claude</strong> — power the optional ERA and AI Copilot features; only used when you or the organizer actively use those features.</li>
              <li><strong>PostHog, Crisp, Sentry, Vercel Analytics</strong> — see &ldquo;Cookies&rdquo; below.</li>
            </ul>
            <p className="mt-3">
              You can read each provider&apos;s own privacy policy for how they
              handle data on our behalf, e.g. Supabase&apos;s at
              supabase.com/privacy.
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
              Data retention
            </h2>
            <p>
              Registration data, Eventera Cards, agenda/networking activity, and
              check-in records are stored as long as the event exists in the
              organizer&apos;s account. When an organizer deletes an event, all
              associated attendee data and generated cards are deleted too.
              Payment records may be retained separately by our payment
              processors as required for accounting, tax, or fraud-prevention
              purposes, independent of what happens on Eventera.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Your rights
            </h2>
            <p>
              You can delete your account at any time. When you delete your
              account, your profile, your events (if you organize any), and
              associated attendee data are permanently removed. If you want to
              delete only specific events, you can do that from the dashboard.
            </p>
            <p className="mt-3">
              If you are an attendee who registered for an event on Eventera and
              want your data removed, email us at hello@eventera.so with the
              event name — or contact the event&apos;s organizer directly, since
              they control the event. You can also request a copy of the data we
              hold about you at the same address.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              International data transfers
            </h2>
            <p>
              Eventera serves organizers and attendees across Africa, the Gulf,
              and beyond. Depending on where you and the event are located, your
              data may be processed in a different country than the one you&apos;re
              in — for example, by a payment processor local to the event&apos;s
              region, or by our cloud infrastructure provider. We only work with
              providers who meet the same data-protection standards described in
              this policy, wherever they operate.
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
