import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of Eventera.',
};

export default function TermsPage() {
  return (
    <>
      <section className="max-w-[820px] mx-auto px-6 pt-20 pb-28">
        <div className="text-[11px] tracking-[0.18em] text-brand-primary mb-4">
          LEGAL
        </div>
        <h1 className="font-title font-bold text-[40px] sm:text-[48px] leading-[1.05] mb-3">
          Terms of Service
        </h1>
        <p className="text-[13px] text-brand-ink/45 mb-10">
          Last updated: May 2026
        </p>

        <div className="space-y-10 text-[16px] text-brand-ink/75 leading-[1.8]">
          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Acceptance
            </h2>
            <p>
              By creating an account or using Eventera, you agree to these terms.
              If you&apos;re using Eventera on behalf of an organization, you
              confirm you have authority to accept these terms for that
              organization.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              What Eventera is
            </h2>
            <p>
              Eventera is a tool that lets designers upload event card designs and
              generate a personalized version for each attendee. You own your
              design files. We provide the software that makes them
              personalizable.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Your account
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>You are responsible for keeping your login details secure.</li>
              <li>
                You are responsible for everything that happens under your
                account.
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
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Acceptable use
            </h2>
            <p className="mb-3">You may not use Eventera to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
              <li>
                Upload designs that infringe on someone else&apos;s copyright or
                trademark
              </li>
              <li>
                Create cards that impersonate a real person or organization
              </li>
              <li>
                Run spam campaigns — do not share your event link without the
                recipient&apos;s permission
              </li>
              <li>Upload illegal content of any kind</li>
              <li>
                Attempt to access other users&apos; data or reverse-engineer the
                platform
              </li>
            </ul>
            <p className="mt-4">
              If we find a violation, we&apos;ll give you notice where possible.
              Serious violations may result in immediate account termination.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Intellectual property
            </h2>
            <p>
              <strong>Your designs are yours.</strong> When you upload a design
              to Eventera, you keep full ownership. We don&apos;t claim any rights
              to your artwork, brand assets, or design files.
            </p>
            <p className="mt-3">
              <strong>The platform is ours.</strong> The Eventera software, editor,
              and infrastructure belong to us. You may not copy, reverse-engineer,
              or redistribute any part of the platform.
            </p>
            <p className="mt-3">
              By uploading a design, you grant Eventera a limited license to
              process and serve it for the purpose of generating attendee cards.
              We do not share your designs with anyone except attendees you send
              the link to, and even then, attendees see only the rendered output
              — not your source file.
            </p>
            <p className="mt-3">
              <strong>Attendee photos.</strong> When an attendee uploads a photo
              to personalize their card, they grant Eventera a limited, royalty-free
              license to composite that photo into their card image and store the
              resulting PNG for re-download purposes. Attendees confirm they have
              the right to use the photo they upload. We do not share attendee
              photos with anyone, use them for advertising, or train AI models on
              them. Attendees may request deletion of their photo and generated
              card by contacting us at{' '}
              <a href="mailto:privacy@eventera.so" className="underline">privacy@eventera.so</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Plans and payment
            </h2>
            <p>
              The Free plan is free forever. Paid plans (Pro and Studio) are
              available by subscription. Current pricing is listed at
              {(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}/pricing. Prices may change; we will give you at least
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
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Cancellation and deletion
            </h2>
            <p>
              You can cancel anytime from your account settings. After
              cancellation, your account reverts to the Free plan. If you want to
              delete your account and all associated data permanently, email
              hello@eventera.so.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Warranty and liability
            </h2>
            <p>
              Eventera is provided &ldquo;as is.&rdquo; We try hard to keep it
              working, but we cannot guarantee 100% uptime. We are not liable for
              any lost data or business impact caused by service interruptions.
            </p>
            <p className="mt-3">
              We are not responsible for how you or your attendees use the cards
              generated by Eventera. You are responsible for ensuring the designs
              you upload don&apos;t violate any laws or third-party rights.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Changes to these terms
            </h2>
            <p>
              We may update these terms as the product evolves. If we make
              material changes, we&apos;ll email you at least 14 days before
              they take effect. Continued use after that date means acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-[22px] text-brand-ink mb-3">
              Contact
            </h2>
            <p>
              Questions about these terms:{" "}
              <a
                href="mailto:hello@eventera.so"
                className="text-brand-primary hover:underline"
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
