export const metadata = {
  title: 'DMCA Takedown Policy',
  description: 'How to submit a DMCA takedown notice or counter-notice to Eventera.',
};

export default function DmcaPage() {
  return (
    <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-24">
      <h1 className="font-title font-bold text-[40px] leading-tight text-[#0F1F18] mb-4">
        DMCA Takedown Policy
      </h1>
      <p className="text-[#6B7A72] text-[15px] mb-12">Last updated: June 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-[15px] leading-relaxed text-[#3A4A42]">

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Overview</h2>
          <p>
            Eventera respects intellectual property rights and complies with the Digital Millennium
            Copyright Act (DMCA). If you believe content on our platform infringes your copyright,
            you may submit a takedown notice to us.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">
            How to submit a takedown notice
          </h2>
          <p>Your notice must include all of the following:</p>
          <ol className="list-decimal list-inside space-y-2 mt-3">
            <li>A physical or electronic signature of the copyright owner or authorised agent.</li>
            <li>Identification of the copyrighted work you claim has been infringed.</li>
            <li>Identification of the infringing material and its location on Eventera (URL or description).</li>
            <li>Your contact information (name, address, phone number, email).</li>
            <li>
              A statement that you have a good-faith belief that the use is not authorised by the
              copyright owner, its agent, or the law.
            </li>
            <li>
              A statement, made under penalty of perjury, that the information in your notice is
              accurate and that you are the copyright owner or authorised to act on their behalf.
            </li>
          </ol>
          <p className="mt-4">
            Send your notice to:{' '}
            <a href="mailto:dmca@eventera.so" className="text-[#1F4D3A] underline">
              dmca@eventera.so
            </a>
          </p>
          <p className="mt-2 text-[#6B7A72] text-[13px]">
            Misrepresentation of copyright infringement may result in liability under Section 512(f) of the DMCA.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Counter-notice</h2>
          <p>
            If you believe your content was removed in error, you may submit a counter-notice
            to{' '}
            <a href="mailto:dmca@eventera.so" className="text-[#1F4D3A] underline">
              dmca@eventera.so
            </a>{' '}
            including:
          </p>
          <ol className="list-decimal list-inside space-y-2 mt-3">
            <li>Your physical or electronic signature.</li>
            <li>Identification of the removed content and its former location.</li>
            <li>
              A statement, under penalty of perjury, that you have a good-faith belief the content
              was removed by mistake or misidentification.
            </li>
            <li>
              Your name, address, phone number, and consent to the jurisdiction of your local
              federal court (or, if outside the US, any judicial district in which Eventera may be
              found).
            </li>
          </ol>
          <p className="mt-4">
            Upon receiving a valid counter-notice we will forward it to the original complainant.
            If they do not file suit within 10 business days, the content may be restored.
          </p>
        </section>

        <section>
          <h2 className="font-display font-semibold text-[22px] text-[#0F1F18] mb-3">Repeat infringers</h2>
          <p>
            Eventera will terminate the accounts of users who are found to be repeat infringers
            of intellectual property rights.
          </p>
        </section>

      </div>
    </main>
  );
}
