export default function ContactPage() {
  return (
    <>
      <section className="max-w-[820px] mx-auto px-6 pt-20 pb-28">
        <div className="text-[11px] tracking-[0.18em] font-mono text-brand-primary mb-4">
          CONTACT
        </div>
        <h1 className="font-display font-bold text-[48px] sm:text-[56px] leading-[1.02] mb-5">
          Get in touch.
        </h1>
        <p className="text-[17px] text-brand-ink/65 max-w-[480px] leading-relaxed mb-14">
          We reply within 24 hours, usually faster.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Email */}
          <a
            href="mailto:hello@cardly.app"
            className="group rounded-2xl border border-brand-border bg-white p-7 hover:shadow-lift hover:border-brand-primary/30 transition"
          >
            <div className="h-10 w-10 rounded-xl bg-brand-offwhite grid place-items-center text-brand-primary mb-5 group-hover:grad-bg group-hover:text-white transition">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="font-display font-semibold text-[17px] mb-1">
              Email
            </div>
            <div className="font-mono text-[14px] text-brand-primary">
              hello@cardly.app
            </div>
            <div className="mt-2 text-[13px] text-brand-ink/50">
              For general questions, feedback, and support.
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/message/cardly"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-brand-border bg-white p-7 hover:shadow-lift hover:border-brand-primary/30 transition"
          >
            <div className="h-10 w-10 rounded-xl bg-brand-offwhite grid place-items-center text-brand-primary mb-5 group-hover:grad-bg group-hover:text-white transition">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="font-display font-semibold text-[17px] mb-1">
              WhatsApp
            </div>
            <div className="font-mono text-[14px] text-brand-primary">
              Message us directly
            </div>
            <div className="mt-2 text-[13px] text-brand-ink/50">
              For quick questions and demo requests.
            </div>
          </a>
        </div>

        {/* Use cases for contact */}
        <div className="mt-12 rounded-2xl bg-brand-offwhite border border-brand-border p-7">
          <div className="font-mono text-[11px] tracking-widest text-brand-ink/40 mb-4">
            GOOD REASONS TO REACH OUT
          </div>
          <ul className="space-y-2.5 text-[15px] text-brand-ink/70">
            {[
              "You want to set up a Pro or Studio account",
              "You have a specific event coming up and want to make sure Cardly can handle it",
              "Something broke and you need help urgently",
              "You have feedback on the product — we read all of it",
              "You're an NGO or educational organization and want to discuss pricing",
              "You want to collaborate (design, engineering, growth)",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
