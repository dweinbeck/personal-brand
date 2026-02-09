import Link from "next/link";

export const metadata = {
  title: "Purchase Cancelled | Daniel Weinbeck",
};

export default function BillingCancelPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="rounded-2xl border border-border bg-surface p-10 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold text-primary font-display mb-2">
          Purchase Cancelled
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          No charges were made. You can try again anytime.
        </p>
        <Link
          href="/billing"
          className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-semibold text-sm text-center border border-gold/30 hover:shadow-lg transition-all"
        >
          Back to Billing
        </Link>
      </div>
    </div>
  );
}
