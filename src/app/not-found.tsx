import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
  robots: {
    index: false,
    follow: false,
  },
};

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/building-blocks", label: "Building Blocks" },
  { href: "/writing", label: "Writing" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center max-w-lg">
        {/* Error code */}
        <p className="text-gold font-mono text-sm font-medium tracking-wider mb-4">
          404 ERROR
        </p>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-text-secondary text-lg mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Primary CTA */}
        <Button href="/" className="mb-8">
          Go to Homepage
        </Button>

        {/* Navigation links */}
        <div className="border-t border-border pt-6">
          <p className="text-text-tertiary text-sm mb-4">Or try one of these:</p>
          <nav className="flex flex-wrap justify-center gap-4">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-secondary hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
