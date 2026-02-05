import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";
import { EmailDanButton } from "@/components/contact/EmailDanButton";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Dan Weinbeck. Email is fastest, or use the contact form.",
};

const EMAIL = "daniel.weinbeck@gmail.com";

const OTHER_LINKS = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/dw789/",
    description: "Connect or send a message",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    href: "https://github.com/dweinbeck",
    description: "Browse open-source projects",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
];

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
          <CopyEmailButton email={EMAIL} variant="cta" />
          <a
            href="https://www.linkedin.com/in/dw789/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary/20 bg-surface px-5 py-3 text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold min-h-[44px]"
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
        <h2 className="text-2xl font-bold text-text-primary">
          Send a Message
        </h2>
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
                href={`mailto:${EMAIL}`}
                className="font-medium text-primary hover:text-gold transition-colors underline"
              >
                {EMAIL}
              </a>
            </p>
          </div>
        </noscript>
      </section>

      {/* Divider */}
      <hr className="my-12 border-border" />

      {/* Other Ways to Reach Me */}
      <section>
        <h2 className="text-2xl font-bold text-text-primary">
          Other Ways to Reach Me
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {OTHER_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold min-h-[44px]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary flex-shrink-0">
                {link.icon}
              </span>
              <div>
                <span className="font-medium text-text-primary">
                  {link.name}
                </span>
                <p className="text-sm text-text-tertiary">
                  {link.description}
                </p>
              </div>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </div>
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
