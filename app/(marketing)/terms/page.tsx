import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of Eventera.',
};

export default function TermsPage() {
  return (
    <>
      <section className="max-w-[820px] mx-auto px-6 pt-20 pb-28">
        <div className="text-[11px] tracking-[0.18em] text-primary mb-4">
          LEGAL
        </div>
        <h1 className="font-title font-bold text-[40px] sm:text-[48px] leading-[1.05] mb-3">
          Terms of Service
        </h1>
        <p className="text-[13px] text-ink/45 mb-10">
          Last updated: July 2026
        </p>

        <div className="space-y-10 text-[16px] text-ink/75 leading-[1.8]">
          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Acceptance
            </h2>
            <p>
              By creating an account or using Eventera, you agree to these terms.
              If you&apos;re using Eventera on behalf of an organization, you
              confirm you have authority to accept these terms for that
              organization. These terms apply to organizers, attendees, speakers,
              sponsors, exhibitors, and anyone else who uses the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              What Eventera is
            </h2>
            <p>
              Eventera is an event management platform and marketplace.
              Organizers use it to create and run events — building an event
              page, selling or issuing tickets, managing an agenda and speakers,
              taking registrations, communicating with attendees, checking
              people in at the door, and reviewing analytics afterward.
              Attendees use it to discover events, register, hold their tickets,
              and connect with other attendees.
            </p>
            <p className="mt-3">
              Every registered attendee also receives an Eventera Card — a
              personalized, auto-generated graphic tied to their registration.
              The Card is a feature of the platform, not a ticket in itself, and
              not a required part of using Eventera.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Your account
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>You are responsible for keeping your login details secure.</li>
              <li>
                You are responsible for everything that happens under your
                account, including events you create and tickets you sell.
              </li>
              <li>
                One account per person. Do not share accounts across
                organizations.
              </li>
              <li>
                You must be 16 or older to create an account. If you are younger,
                a parent or guardian must agree to these terms on your behalf.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Events, tickets, and registrations
            </h2>
            <p>
              <strong>Organizers are responsible for their own events.</strong>{' '}
              Eventera provides the platform; the organizer decides what to list,
              how to price it, and how to run it. You are responsible for the
              accuracy of your event listing, complying with any laws that apply
              to your event (including venue, safety, tax, and consumer
              protection rules in your jurisdiction), and honoring the terms you
              set for your own attendees — including your refund and
              cancellation policy.
            </p>
            <p className="mt-3">
              <strong>Eventera is not the organizer of your event.</strong> We do
              not vet events before they&apos;re published, and we are not a
              party to the relationship between an organizer and their
              attendees. If an event is cancelled, changed, or misrepresented,
              that is between the organizer and their attendees to resolve —
              though we may step in if a listing violates the acceptable-use
              rules below.
            </p>
            <p className="mt-3">
              <strong>Attendees</strong> are responsible for the accuracy of the
              information they submit when registering, and for reviewing an
              event&apos;s specific refund/cancellation terms (set by the
              organizer, not by Eventera) before paying for a ticket.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Payments and payouts
            </h2>
            <p>
              Paid registrations are processed through third-party payment
              processors — Stripe internationally, and Flutterwave or WaafiPay
              in supported African markets. Eventera does not store your full
              card number; payment details are handled directly by the
              processor. Use of a payment processor is also subject to that
              processor&apos;s own terms.
            </p>
            <p className="mt-3">
              Depending on your plan, Eventera may charge a subscription fee, a
              per-ticket fee on paid registrations, or both — current pricing is
              at{' '}
              <Link href="/pricing" className="text-primary underline">
                {(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}/pricing
              </Link>
              . Payouts to organizers, and the timing of those payouts,
              are governed by the connected payment processor&apos;s payout
              schedule and rules, which Eventera does not control.
            </p>
            <p className="mt-3">
              Refunds to attendees for a specific event are the organizer&apos;s
              responsibility, in line with the refund policy they set for that
              event. Chargebacks and payment disputes are handled per the
              payment processor&apos;s dispute process.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Acceptable use
            </h2>
            <p className="mb-3">You may not use Eventera to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>
                List a fraudulent, fake, or intentionally misleading event, or
                sell tickets you have no intention of honoring
              </li>
              <li>
                Upload content — designs, event descriptions, images — that
                infringes on someone else&apos;s copyright or trademark
              </li>
              <li>
                Create an event, profile, or card that impersonates a real
                person or organization
              </li>
              <li>
                Send bulk messages, broadcasts, or event invitations to people
                who haven&apos;t agreed to receive them
              </li>
              <li>Upload illegal content of any kind</li>
              <li>
                Scrape, harvest, or resell attendee, speaker, or sponsor data
                collected through the platform
              </li>
              <li>
                Attempt to access other users&apos; data, bypass check-in or
                access controls, or reverse-engineer the platform
              </li>
            </ul>
            <p className="mt-4">
              If we find a violation, we&apos;ll give you notice where possible.
              Serious violations — including payment fraud or fake events — may
              result in immediate account termination and forfeiture of pending
              payouts.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Intellectual property
            </h2>
            <p>
              <strong>Your content is yours.</strong> Event descriptions,
              agendas, branding, card designs, and any other content you upload
              remain yours. We don&apos;t claim ownership of your artwork, brand
              assets, or event content.
            </p>
            <p className="mt-3">
              <strong>The platform is ours.</strong> The Eventera software,
              editor, and infrastructure belong to us. You may not copy,
              reverse-engineer, or redistribute any part of the platform.
            </p>
            <p className="mt-3">
              By uploading content, you grant Eventera a limited license to
              process, store, and display it for the purpose of running your
              event and generating attendee cards. We do not share your content
              with anyone beyond what&apos;s needed to run the platform (for
              example, showing your event to people who view or register for
              it), and card recipients see only the rendered card image — not
              your source design file.
            </p>
            <p className="mt-3">
              <strong>Attendee photos.</strong> When an attendee uploads a photo
              to personalize their Eventera Card, they grant Eventera a limited,
              royalty-free license to composite that photo into their card image
              and store the resulting PNG for re-download purposes. Attendees
              confirm they have the right to use the photo they upload. We do
              not share attendee photos with anyone, use them for advertising,
              or train AI models on them. Attendees may request deletion of
              their photo and generated card by contacting us at{' '}
              <a href="mailto:privacy@eventera.so" className="underline">privacy@eventera.so</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              AI features
            </h2>
            <p>
              Eventera offers optional AI-assisted features on some plans — ERA
              (event content suggestions, FAQ answers, attendee matchmaking, and
              analytics summaries) and an AI Copilot for organizers. Using these
              features sends the relevant text you provide, or platform data
              needed to answer your request, to a third-party AI provider for
              processing. We don&apos;t use your data to train third-party
              models, and these features are opt-in — the core platform works
              fully without them.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Plans and payment
            </h2>
            <p>
              The Free plan is free forever. Paid plans (Pro and Studio) are
              available by subscription. Current pricing is listed at{' '}
              <Link href="/pricing" className="text-primary underline">
                {(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}/pricing
              </Link>
              . Prices may change; we will give you at least
              30 days&apos; notice before changing the price of an active
              subscription.
            </p>
            <p className="mt-3">
              If you are on a paid plan and downgrade or cancel, access continues
              until the end of the billing period. No partial refunds for unused
              time.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Cancellation and deletion
            </h2>
            <p>
              You can cancel your subscription anytime from your account
              settings. After cancellation, your account reverts to the Free
              plan. If you want to delete your account and all associated data
              permanently, email hello@eventera.so. If you have upcoming events
              with registered attendees, cancel or transfer those events first —
              account deletion does not automatically notify your attendees.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Warranty and liability
            </h2>
            <p>
              Eventera is provided &ldquo;as is.&rdquo; We try hard to keep it
              working, but we cannot guarantee 100% uptime. We are not liable for
              any lost data or business impact caused by service interruptions.
            </p>
            <p className="mt-3">
              We are not responsible for how organizers run their events, or how
              organizers and attendees use the platform, tickets, or cards
              generated through it. You are responsible for ensuring the events
              you create, and the content you upload, don&apos;t violate any laws
              or third-party rights.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Changes to these terms
            </h2>
            <p>
              We may update these terms as the product evolves. If we make
              material changes, we&apos;ll email you at least 14 days before
              they take effect. Continued use after that date means acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-ink mb-3">
              Contact
            </h2>
            <p>
              Questions about these terms:{" "}
              <a
                href="mailto:hello@eventera.so"
                className="text-primary hover:underline"
              >
                hello@eventera.so
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
