"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_EMAIL } from "@/lib/constants";

const baseLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Building Blocks", href: "/building-blocks" },

  { name: "Assistant", href: "/assistant" },
  { name: "Contact", href: "/contact" },
];

export function NavLinks() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const links = useMemo(() => {
    if (user?.email === ADMIN_EMAIL) {
      return [
        ...baseLinks,
        { name: "Control Center", href: "/control-center" },
      ];
    }
    return baseLinks;
  }, [user]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1" aria-label="Main">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
              isActive(link.href)
                ? "bg-primary text-white font-bold shadow-sm border border-gold"
                : "text-text-secondary hover:text-primary hover:bg-gold-light",
            )}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger button */}
      <button
        type="button"
        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-primary hover:bg-gold-light transition-colors"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          {mobileOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      <div
        className={clsx(
          "absolute top-full left-0 right-0 glass-warm border-b border-border shadow-sm md:hidden transition-all duration-200 overflow-hidden",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="flex flex-col px-4 py-2" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive(link.href)
                  ? "text-primary bg-gold-light border-l-2 border-gold"
                  : "text-text-secondary hover:text-primary hover:bg-gold-light",
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
