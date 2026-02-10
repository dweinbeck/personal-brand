"use client";

export function CreateEnvelopeCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:border-gold/40 hover:bg-gold-light/50 min-h-[160px]"
    >
      <span className="text-3xl text-text-tertiary">+</span>
      <span className="text-sm font-medium text-text-secondary">
        Add Envelope
      </span>
    </button>
  );
}
