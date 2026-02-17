"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DemoProvider } from "@/components/envelopes/demo/DemoProvider";

const basePath = "/envelopes/demo";

const navLinks = [
  { name: "Home", href: basePath, exact: true },
  { name: "Transactions", href: `${basePath}/transactions`, exact: false },
  { name: "Analytics", href: `${basePath}/analytics`, exact: false },
];

function DemoNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-gray-200 bg-white" aria-label="Demo Envelopes">
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

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <DemoProvider>
      {/* Demo mode banner */}
      <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Demo Mode</span> — data resets on
          refresh.{" "}
          <Link
            href="/envelopes"
            className="font-medium underline hover:text-amber-900"
          >
            Sign in to save your data
          </Link>
        </p>
      </div>
      <DemoNav />
      {children}
    </DemoProvider>
  );
}
