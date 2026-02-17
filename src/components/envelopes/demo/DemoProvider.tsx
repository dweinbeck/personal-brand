"use client";

import type { ReactNode } from "react";
import { createContext, use, useReducer } from "react";
import {
  getRemainingDaysPercent,
  getStatusLabel,
} from "@/lib/envelopes/week-math";
import {
  DEMO_ENVELOPES,
  DEMO_TRANSACTIONS,
  type DemoEnvelope,
  type DemoTransaction,
} from "./seed-data";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type DemoState = {
  envelopes: DemoEnvelope[];
  transactions: DemoTransaction[];
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type DemoAction =
  | {
      type: "ADD_ENVELOPE";
      payload: Omit<
        DemoEnvelope,
        "id" | "sortOrder" | "spentCents" | "remainingCents" | "status"
      >;
    }
  | { type: "ADD_TRANSACTION"; payload: Omit<DemoTransaction, "id"> }
  | { type: "DELETE_ENVELOPE"; payload: { id: string } }
  | { type: "DELETE_TRANSACTION"; payload: { id: string } };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function recomputeEnvelope(
  envelope: DemoEnvelope,
  transactions: DemoTransaction[],
): DemoEnvelope {
  const spentCents = transactions
    .filter((t) => t.envelopeId === envelope.id)
    .reduce((sum, t) => sum + t.amountCents, 0);
  const remainingCents = envelope.weeklyBudgetCents - spentCents;
  const remainingDaysPercent = getRemainingDaysPercent(new Date());
  const status = getStatusLabel(
    remainingCents,
    envelope.weeklyBudgetCents,
    remainingDaysPercent,
  );
  return { ...envelope, spentCents, remainingCents, status };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "ADD_ENVELOPE": {
      const maxSortOrder = state.envelopes.reduce(
        (max, e) => Math.max(max, e.sortOrder),
        0,
      );
      const newEnvelope: DemoEnvelope = {
        id: crypto.randomUUID(),
        sortOrder: maxSortOrder + 1,
        spentCents: 0,
        remainingCents: action.payload.weeklyBudgetCents,
        status: "On Track",
        ...action.payload,
      };
      return { ...state, envelopes: [...state.envelopes, newEnvelope] };
    }

    case "ADD_TRANSACTION": {
      const newTransaction: DemoTransaction = {
        id: crypto.randomUUID(),
        ...action.payload,
      };
      const updatedTransactions = [...state.transactions, newTransaction];
      const updatedEnvelopes = state.envelopes.map((env) =>
        env.id === action.payload.envelopeId
          ? recomputeEnvelope(env, updatedTransactions)
          : env,
      );
      return { envelopes: updatedEnvelopes, transactions: updatedTransactions };
    }

    case "DELETE_ENVELOPE": {
      return {
        envelopes: state.envelopes.filter((e) => e.id !== action.payload.id),
        transactions: state.transactions.filter(
          (t) => t.envelopeId !== action.payload.id,
        ),
      };
    }

    case "DELETE_TRANSACTION": {
      const txn = state.transactions.find((t) => t.id === action.payload.id);
      const updatedTransactions = state.transactions.filter(
        (t) => t.id !== action.payload.id,
      );
      const updatedEnvelopes = txn
        ? state.envelopes.map((env) =>
            env.id === txn.envelopeId
              ? recomputeEnvelope(env, updatedTransactions)
              : env,
          )
        : state.envelopes;
      return { envelopes: updatedEnvelopes, transactions: updatedTransactions };
    }
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DemoContext = createContext<{
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
} | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, {
    envelopes: DEMO_ENVELOPES,
    transactions: DEMO_TRANSACTIONS,
  });

  return <DemoContext value={{ state, dispatch }}>{children}</DemoContext>;
}

export function useDemo() {
  const ctx = use(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return ctx;
}
