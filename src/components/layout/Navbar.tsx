import Link from "next/link";
import { NavLinks } from "./NavLinks";

export function Navbar() {
  return (
    <header className="relative bg-white border-b border-gray-200">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Dan Weinbeck
          </Link>
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
