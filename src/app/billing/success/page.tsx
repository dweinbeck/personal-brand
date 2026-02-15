import Link from "next/link";

export const metadata = {
  title: "Purchase Complete | Daniel Weinbeck",
};

export default function BillingSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="rounded-2xl border border-border bg-surface p-10 shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
          &#10003;
        </div>
        <h1 className="text-2xl font-bold text-primary font-display mb-2">
          Credits Purchased!
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Your balance has been updated. It may take a few seconds for credits
          to appear.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/billing"
            className="block px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-semibold text-sm text-center border border-gold/30 hover:shadow-lg transition-all"
          >
            View Balance
          </Link>
          <Link
            href="/apps/brand-scraper"
            className="block px-5 py-2.5 rounded-xl border border-border text-text-secondary text-sm text-center hover:bg-gold-light transition-all"
          >
            Try Brands
          </Link>
        </div>
      </div>
    </div>
  );
}
