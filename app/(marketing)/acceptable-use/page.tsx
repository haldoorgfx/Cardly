export const metadata = {
  title: 'Acceptable Use Policy',
  description: 'The events and conduct that are and are not allowed on Eventera.',
};

export default function AcceptableUsePage() {
  return (
    <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-24">
      <h1 className="font-title font-bold text-[40px] leading-tight text-[#0F1F18] mb-4">
        Acceptable Use Policy
      </h1>
      <p className="text-[#6B7A72] text-[15px] mb-12">Last updated: July 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-[15px] leading-relaxed text-[#3A4A42]">

        <section>
          <p>
            Eventera helps people create, promote, and run real-world and online events. This policy
            explains what you may and may not do on the platform. It applies to organizers, attendees,
            speakers, sponsors, and anyone else using Eventera. By using Eventera you agree to follow
            it. It supplements our{' '}
            <a href="/terms" className="text-[#1F4D3A] underline">Terms of Service</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">You may not use Eventera to</h2>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Create fake, fraudulent, or deceptive events, or misrepresent who is organizing an event.</li>
            <li>Sell tickets you are not authorized to sell, or run scams, phishing, or money-laundering schemes.</li>
            <li>Promote or facilitate violence, terrorism, human trafficking, or the exploitation or endangerment of children.</li>
            <li>Post hateful content or incite harassment or discrimination against people based on protected characteristics.</li>
            <li>Sell or promote illegal goods or services, weapons, illegal drugs, or other unlawful activity.</li>
            <li>Infringe the intellectual property, privacy, or publicity rights of others (see our <a href="/dmca" className="text-[#1F4D3A] underline">DMCA policy</a>).</li>
            <li>Upload malware, attempt to breach security, scrape data, or interfere with the platform&rsquo;s operation.</li>
            <li>Send spam or unsolicited bulk messages, or misuse attendee contact details.</li>
            <li>Collect, store, or share attendee personal data in violation of applicable law or our Privacy Policy.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Organizer responsibilities</h2>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Describe your event accurately, including date, location, price, and what a ticket includes.</li>
            <li>Honor the tickets you sell and the refund terms you publish.</li>
            <li>Handle attendee data lawfully and only for running your event, in line with our Privacy Policy.</li>
            <li>Comply with all laws and permits that apply to your event and jurisdiction.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Reporting a problem</h2>
          <p>
            If you see an event or user that violates this policy, report it to{' '}
            <a href="mailto:trust@eventera.so" className="text-[#1F4D3A] underline">trust@eventera.so</a>.
            We review reports and may act on them, including removing content.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Enforcement</h2>
          <p>
            When we find a violation we may, at our discretion and depending on severity, remove or
            unpublish content, limit features, suspend or terminate accounts, withhold payouts, and
            cooperate with law enforcement. We may act immediately and without notice where there is a
            risk of harm, fraud, or legal exposure.
          </p>
        </section>

        <p className="text-[#6B7A72] text-[13px]">
          We may update this policy as the platform and legal requirements evolve. Continued use of
          Eventera after changes take effect means you accept the updated policy.
        </p>
      </div>
    </main>
  );
}
