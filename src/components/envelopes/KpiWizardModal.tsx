"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCents } from "@/lib/envelopes/format";
import {
  computeDisposableIncomeCents,
  normalizeToWeeklyCents,
} from "@/lib/envelopes/kpi-math";
import type { EnvelopeProfileInput } from "@/lib/envelopes/types";

type Frequency = "weekly" | "biweekly" | "monthly";

type IncomeSource = {
  frequency: Frequency;
  amount: string; // dollars string from input
};

type KpiWizardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: EnvelopeProfileInput) => void;
  initialProfile?: EnvelopeProfileInput | null;
};

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

function dollarsToCents(dollars: string): number {
  const parsed = Number.parseFloat(dollars);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function FrequencySelector({
  value,
  onChange,
}: {
  value: Frequency;
  onChange: (f: Frequency) => void;
}) {
  return (
    <div className="flex gap-2">
      {FREQUENCY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            value === opt.value
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border text-text-secondary hover:border-primary/30"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DollarInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
        $
      </span>
      <input
        id={id}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "0.00"}
        className="w-full rounded-lg border border-border bg-surface pl-7 pr-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={`step-${i + 1}`}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i + 1 <= current ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
      <span className="text-xs text-text-secondary ml-1">
        Step {current} of {total}
      </span>
    </div>
  );
}

export function KpiWizardModal({
  isOpen,
  onClose,
  onSave,
  initialProfile,
}: KpiWizardModalProps) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // -- Income state --
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(() => {
    if (initialProfile) {
      return [
        {
          frequency: "weekly" as Frequency,
          amount: centsToDollars(initialProfile.averageWeeklyIncomeCents),
        },
      ];
    }
    return [{ frequency: "weekly" as Frequency, amount: "" }];
  });
  const [showAddIncome, setShowAddIncome] = useState(false);

  // -- Bills state --
  const [billsFrequency, setBillsFrequency] = useState<Frequency>("monthly");
  const [billsAmount, setBillsAmount] = useState(() =>
    initialProfile
      ? centsToDollars(initialProfile.averageWeeklyBillsCents)
      : "",
  );

  // -- Savings state --
  const [savingsAmount, setSavingsAmount] = useState(() =>
    initialProfile
      ? centsToDollars(initialProfile.targetWeeklySavingsCents)
      : "",
  );

  // -- Computed values --
  function computeWeeklyIncomeCents(): number {
    return incomeSources.reduce((sum, src) => {
      const cents = dollarsToCents(src.amount);
      return sum + normalizeToWeeklyCents(cents, src.frequency);
    }, 0);
  }

  function computeWeeklyBillsCents(): number {
    const cents = dollarsToCents(billsAmount);
    // For pre-filled edit mode where frequency is "weekly", pass through
    if (initialProfile && billsFrequency === "monthly") {
      return normalizeToWeeklyCents(cents, "monthly");
    }
    return normalizeToWeeklyCents(cents, billsFrequency);
  }

  const weeklyIncomeCents = computeWeeklyIncomeCents();
  const weeklyBillsCents = computeWeeklyBillsCents();
  const disposableCents = computeDisposableIncomeCents(
    weeklyIncomeCents,
    weeklyBillsCents,
  );
  const weeklySavingsCents = dollarsToCents(savingsAmount);

  // -- Validation --
  function isStep1Valid(): boolean {
    return incomeSources.some((src) => dollarsToCents(src.amount) > 0);
  }

  function isStep2Valid(): boolean {
    return dollarsToCents(billsAmount) >= 0;
  }

  // -- Income source management --
  function updateIncomeSource(
    index: number,
    field: keyof IncomeSource,
    value: string,
  ) {
    setIncomeSources((prev) =>
      prev.map((src, i) => (i === index ? { ...src, [field]: value } : src)),
    );
  }

  function addIncomeSource() {
    setIncomeSources((prev) => [
      ...prev,
      { frequency: "weekly" as Frequency, amount: "" },
    ]);
    setShowAddIncome(false);
  }

  function removeIncomeSource(index: number) {
    if (incomeSources.length <= 1) return;
    setIncomeSources((prev) => prev.filter((_, i) => i !== index));
  }

  // -- Save handler --
  async function handleSave() {
    setIsSaving(true);
    try {
      const profile: EnvelopeProfileInput = {
        averageWeeklyIncomeCents: weeklyIncomeCents,
        averageWeeklyBillsCents: weeklyBillsCents,
        targetWeeklySavingsCents: weeklySavingsCents,
      };
      await onSave(profile);
    } finally {
      setIsSaving(false);
    }
  }

  // -- Reset on close --
  function handleClose() {
    setStep(1);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      aria-label="Budget Setup Wizard"
    >
      <div className="p-6">
        <StepIndicator current={step} total={4} />

        {/* Step 1: Income */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              What&apos;s your income?
            </h2>
            <div className="space-y-4">
              {incomeSources.map((src, index) => (
                <div key={`income-${index + 1}`} className="space-y-2">
                  {incomeSources.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">
                        Income source {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeIncomeSource(index)}
                        className="text-xs text-text-secondary hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <span className="block text-sm text-text-secondary mb-1">
                    How often are you paid?
                  </span>
                  <FrequencySelector
                    value={src.frequency}
                    onChange={(f) => updateIncomeSource(index, "frequency", f)}
                  />
                  <label
                    htmlFor={`income-amount-${index}`}
                    className="block text-sm text-text-secondary mb-1 mt-3"
                  >
                    Amount
                  </label>
                  <DollarInput
                    id={`income-amount-${index}`}
                    value={src.amount}
                    onChange={(v) => updateIncomeSource(index, "amount", v)}
                    placeholder="2000.00"
                  />
                </div>
              ))}

              {!showAddIncome && (
                <button
                  type="button"
                  onClick={() => setShowAddIncome(true)}
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  + Add another income source
                </button>
              )}

              {showAddIncome && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addIncomeSource}
                  >
                    Yes, add another
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddIncome(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep(2)}
                disabled={!isStep1Valid()}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Bills */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              What are your regular bills?
            </h2>
            <div className="space-y-3">
              <span className="block text-sm text-text-secondary">
                How often do you pay bills?
              </span>
              <FrequencySelector
                value={billsFrequency}
                onChange={setBillsFrequency}
              />
              <label
                htmlFor="bills-amount"
                className="block text-sm text-text-secondary mt-3"
              >
                Total bills amount
              </label>
              <DollarInput
                id="bills-amount"
                value={billsAmount}
                onChange={setBillsAmount}
                placeholder="1500.00"
              />
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep(3)}
                disabled={!isStep2Valid()}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Savings Target */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              How much do you want to save?
            </h2>

            <div className="rounded-lg bg-gold-light/50 border border-gold/20 p-3 mb-4">
              <p className="text-sm text-text-secondary">
                Your disposable income is{" "}
                <span className="font-semibold text-text-primary">
                  {formatCents(disposableCents)}/week
                </span>
              </p>
            </div>

            <label
              htmlFor="savings-amount"
              className="block text-sm text-text-secondary mb-2"
            >
              Weekly savings target
            </label>
            <DollarInput
              id="savings-amount"
              value={savingsAmount}
              onChange={setSavingsAmount}
              placeholder="50.00"
            />

            {disposableCents > 0 && (
              <div className="mt-3">
                <p className="text-xs text-text-secondary mb-2">
                  Quick select (% of disposable income):
                </p>
                <div className="flex gap-2">
                  {[10, 15, 20].map((pct) => {
                    const targetCents = Math.round(
                      disposableCents * (pct / 100),
                    );
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          setSavingsAmount(centsToDollars(targetCents))
                        }
                        className="px-3 py-1 text-xs rounded-lg border border-border text-text-secondary hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        {pct}% ({formatCents(targetCents)})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {weeklySavingsCents > disposableCents && disposableCents > 0 && (
              <p className="mt-3 text-xs text-amber-600">
                Your savings target exceeds your disposable income. You can
                still proceed, but you may need to adjust later.
              </p>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" size="sm" onClick={() => setStep(4)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              Review your budget
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-text-secondary">
                  Weekly Income
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {formatCents(weeklyIncomeCents)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-text-secondary">
                  Weekly Bills
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {formatCents(weeklyBillsCents)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-text-secondary">
                  Disposable Income
                </span>
                <span
                  className={`text-sm font-semibold ${disposableCents >= 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {formatCents(disposableCents)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">
                  Target Savings
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {formatCents(weeklySavingsCents)}
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
