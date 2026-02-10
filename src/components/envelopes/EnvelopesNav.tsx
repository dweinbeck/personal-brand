"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Home", href: "/envelopes", exact: true },
  { name: "Transactions", href: "/envelopes/transactions", exact: false },
  { name: "Analytics", href: "/envelopes/analytics", exact: false },
];

export function EnvelopesNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-gray-200 bg-white" aria-label="Envelopes">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {navLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "py-3 text-sm font-medium border-b-2 transition-colors",
                  active
                    ? "border-gold text-primary font-semibold"
                    : "border-transparent text-text-secondary hover:text-primary hover:bg-gold-light rounded-t",
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
