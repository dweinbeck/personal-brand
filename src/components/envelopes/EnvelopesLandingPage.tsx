"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

const features = [
  {
    title: "Weekly Budgets",
    description:
      "Set spending limits for each category and track every dollar.",
    icon: "W",
  },
  {
    title: "Smart Tracking",
    description: "See exactly how much you have left in real time.",
    icon: "S",
  },
  {
    title: "Overage Reallocation",
    description: "Overspent? Move funds from another envelope.",
    icon: "O",
  },
  {
    title: "Savings Analytics",
    description: "Watch your savings grow week over week.",
    icon: "A",
  },
];

export function EnvelopesLandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-3">
          Envelopes
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Envelope Budgeting Made Simple
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {features.map((feature) => (
          <Card key={feature.title} variant="default">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {feature.icon}
                </span>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-primary mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {/* CTA Card */}
        <Card variant="featured" className="flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-primary mb-2">
              Try It Out
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              See how envelope budgeting works with sample data. No sign-in
              required.
            </p>
          </div>
          <Link
            href="/envelopes/demo"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-full bg-gold text-primary hover:bg-gold/80 transition-all"
          >
            View Demo
          </Link>
        </Card>
      </div>
    </div>
  );
}
