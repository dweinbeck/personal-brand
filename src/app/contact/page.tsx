import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Dan Weinbeck.",
};

const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/dw789/" },
  { name: "Instagram", href: "https://instagram.com/dweinbeck" },
  { name: "GitHub", href: "https://github.com/dweinbeck" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Get in Touch</h1>
      <p className="mt-4 text-gray-600">
        Have a question or want to work together? I'd love to hear from you.
      </p>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        {/* Left column: Contact form */}
        <div>
          <ContactForm />
        </div>

        {/* Right column: Email + Social links */}
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email</h2>
            <div className="mt-2">
              <CopyEmailButton email="daniel.weinbeck@gmail.com" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Connect</h2>
            <ul className="mt-2 space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {link.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
