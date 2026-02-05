import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { AuthButton } from "./AuthButton";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass-warm border-b border-border shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Wordmark + social icons */}
          <div className="flex items-center gap-5">
            <Link href="/" className="group">
              <span className="font-display text-xl font-extrabold tracking-tight text-primary group-hover:text-gold transition-colors border-b-2 border-gold pb-0.5">
                DW
              </span>
            </Link>
          </div>

          {/* Right: Nav links + auth */}
          <div className="flex items-center">
            <NavLinks />
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
