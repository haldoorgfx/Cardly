export const metadata = {
  title: 'Refund Policy',
  description: 'How refunds and cancellations work for events booked through Eventera.',
};

export default function RefundPolicyPage() {
  return (
    <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-24">
      <h1 className="font-title font-bold text-[40px] leading-tight text-[#0F1F18] mb-4">
        Refund Policy
      </h1>
      <p className="text-[#6B7A72] text-[15px] mb-12">Last updated: July 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-[15px] leading-relaxed text-[#3A4A42]">

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Who sets the refund terms</h2>
          <p>
            Eventera is a platform that event organizers use to sell tickets and manage their events.
            The organizer of each event is the merchant of record for that event and sets its own
            refund and cancellation terms. Where an organizer publishes terms on their event page,
            those terms apply. This policy describes the baseline that applies when an organizer has
            not published different terms, and how the refund process works on Eventera.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Requesting a refund</h2>
          <p>
            To request a refund, contact the event organizer first — their contact details appear on
            the event page and in your confirmation email. If you cannot reach the organizer, contact
            us at{' '}
            <a href="mailto:support@eventera.so" className="text-[#1F4D3A] underline">support@eventera.so</a>{' '}
            and we will help facilitate the request. Include your order/confirmation reference and the
            email address you registered with.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Event cancellations &amp; changes</h2>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>If an organizer <strong>cancels</strong> an event, eligible ticket holders are entitled to a refund of the ticket price.</li>
            <li>If an event is <strong>rescheduled</strong>, your ticket normally remains valid for the new date; if you cannot attend, you may request a refund per the organizer&rsquo;s terms.</li>
            <li>Refunds are issued to the original payment method used at checkout.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Payment methods &amp; timing</h2>
          <p>
            Eventera supports card payments (Stripe), Flutterwave, and WaafiPay depending on the
            event. Once a refund is approved:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li><strong>Card / Stripe:</strong> refunds are processed back to your card and typically appear within 5&ndash;10 business days, depending on your bank.</li>
            <li><strong>WaafiPay / Flutterwave (mobile money):</strong> refunds are processed through the provider and returned to the account used to pay; timing depends on the provider.</li>
          </ul>
          <p className="mt-3">
            When a refund is completed, your ticket is voided and can no longer be used for entry.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Fees</h2>
          <p>
            Unless required by law or stated otherwise by the organizer, third-party payment
            processing fees may be non-refundable. The refundable amount is the ticket price actually
            paid, net of any such non-refundable fees.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Free events</h2>
          <p>
            Free registrations have no charge and therefore nothing to refund. You can cancel a free
            registration at any time from your tickets.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Questions</h2>
          <p>
            For help with a refund or to report a problem with an event, contact{' '}
            <a href="mailto:support@eventera.so" className="text-[#1F4D3A] underline">support@eventera.so</a>.
          </p>
        </section>

        <p className="text-[#6B7A72] text-[13px]">
          This policy is a general summary and does not override an organizer&rsquo;s published terms or
          your rights under applicable local consumer-protection law.
        </p>
      </div>
    </main>
  );
}
