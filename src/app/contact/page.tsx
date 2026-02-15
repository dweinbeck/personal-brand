import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";
import { EmailDanButton } from "@/components/contact/EmailDanButton";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Dan Weinbeck. Email is fastest, or use the contact form.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Contact Dan
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Fastest is email. Form works too &mdash; I read everything.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <EmailDanButton />
          <CopyEmailButton email={CONTACT_EMAIL} variant="cta" />
          <a
            href="https://www.linkedin.com/in/dw789/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-primary to-primary-hover px-5 py-3 text-sm font-medium text-white border border-gold/40 shadow-lg shadow-[rgba(27,42,74,0.20)] transition-all duration-200 hover:shadow-xl hover:shadow-[rgba(200,165,90,0.20)] hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold min-h-[44px]"
          >
            {/* LinkedIn icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn Message
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>

        {/* Microcopy */}
        <div className="mt-6 space-y-1 text-sm text-text-tertiary">
          <p>Typical reply: 1&ndash;2 business days.</p>
          <p>
            If it&rsquo;s urgent, put{" "}
            <span className="font-medium text-text-secondary">
              &ldquo;URGENT&rdquo;
            </span>{" "}
            in the subject.
          </p>
        </div>
      </section>

      {/* Divider */}
      <hr className="my-12 border-border" />

      {/* Contact Form Section */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary">Send a Message</h2>
        <p className="mt-2 text-sm text-text-secondary">
          All fields are required. I&rsquo;ll respond via the email you provide.
        </p>

        <div className="mt-6">
          <ContactForm />
        </div>

        {/* Noscript fallback */}
        <noscript>
          <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-text-secondary">
            <p>
              JavaScript is required for the contact form. Please email me
              directly at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-primary hover:text-gold transition-colors underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </noscript>
      </section>

      {/* Divider */}
      <hr className="my-12 border-border" />

      {/* Privacy / Retention Note */}
      <section className="text-center">
        <div className="mx-auto max-w-lg space-y-2 text-sm text-text-tertiary">
          <p className="font-medium text-text-secondary">Privacy Note</p>
          <p>Messages are used only to respond.</p>
          <p>Stored for up to 90 days for follow-up, then deleted.</p>
          <p>Please don&rsquo;t send sensitive personal info.</p>
        </div>
      </section>
    </div>
  );
}
