"use client";

import type { ReactNode } from "react";
import { createContext, use, useReducer } from "react";
import {
  getRemainingDaysPercent,
  getStatusLabel,
} from "@/lib/envelopes/week-math";
import {
  DEMO_ENVELOPES,
  DEMO_HISTORICAL_INCOME,
  DEMO_HISTORICAL_TRANSACTIONS,
  DEMO_INCOME_ENTRIES,
  DEMO_PROFILE,
  DEMO_TRANSACTIONS,
  type DemoEnvelope,
  type DemoIncomeEntry,
  type DemoProfile,
  type DemoTransaction,
  type DemoTransfer,
} from "./seed-data";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type DemoState = {
  envelopes: DemoEnvelope[];
  transactions: DemoTransaction[];
  transfers: DemoTransfer[];
  incomeEntries: DemoIncomeEntry[];
  profile: DemoProfile;
  historicalTransactions: DemoTransaction[];
  historicalIncome: DemoIncomeEntry[];
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
  | { type: "DELETE_TRANSACTION"; payload: { id: string } }
  | {
      type: "UPDATE_ENVELOPE_BUDGET";
      payload: { id: string; weeklyBudgetCents: number };
    }
  | {
      type: "TRANSFER_FUNDS";
      payload: {
        fromEnvelopeId: string;
        toEnvelopeId: string;
        amountCents: number;
      };
    }
  | { type: "ADD_INCOME_ENTRY"; payload: Omit<DemoIncomeEntry, "id"> }
  | { type: "DELETE_INCOME_ENTRY"; payload: { id: string } }
  | { type: "UPDATE_PROFILE"; payload: DemoProfile };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeNetTransfers(
  envelopeId: string,
  transfers: DemoTransfer[],
): number {
  let net = 0;
  for (const t of transfers) {
    if (t.toEnvelopeId === envelopeId) net += t.amountCents;
    if (t.fromEnvelopeId === envelopeId) net -= t.amountCents;
  }
  return net;
}

function recomputeEnvelope(
  envelope: DemoEnvelope,
  transactions: DemoTransaction[],
  transfers: DemoTransfer[],
): DemoEnvelope {
  const spentCents = transactions
    .filter((t) => t.envelopeId === envelope.id)
    .reduce((sum, t) => sum + t.amountCents, 0);
  const netTransfer = computeNetTransfers(envelope.id, transfers);
  const remainingCents = envelope.weeklyBudgetCents - spentCents + netTransfer;
  const remainingDaysPercent = getRemainingDaysPercent(new Date());
  const status = getStatusLabel(
    remainingCents,
    envelope.weeklyBudgetCents,
    remainingDaysPercent,
  );
  return { ...envelope, spentCents, remainingCents, status };
}

function recomputeAllEnvelopes(
  envelopes: DemoEnvelope[],
  transactions: DemoTransaction[],
  transfers: DemoTransfer[],
): DemoEnvelope[] {
  return envelopes.map((env) =>
    recomputeEnvelope(env, transactions, transfers),
  );
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
      return {
        ...state,
        transactions: updatedTransactions,
        envelopes: recomputeAllEnvelopes(
          state.envelopes,
          updatedTransactions,
          state.transfers,
        ),
      };
    }

    case "DELETE_ENVELOPE": {
      return {
        ...state,
        envelopes: state.envelopes.filter((e) => e.id !== action.payload.id),
        transactions: state.transactions.filter(
          (t) => t.envelopeId !== action.payload.id,
        ),
      };
    }

    case "DELETE_TRANSACTION": {
      const updatedTransactions = state.transactions.filter(
        (t) => t.id !== action.payload.id,
      );
      return {
        ...state,
        transactions: updatedTransactions,
        envelopes: recomputeAllEnvelopes(
          state.envelopes,
          updatedTransactions,
          state.transfers,
        ),
      };
    }

    case "UPDATE_ENVELOPE_BUDGET": {
      const updatedEnvelopes = state.envelopes.map((env) =>
        env.id === action.payload.id
          ? { ...env, weeklyBudgetCents: action.payload.weeklyBudgetCents }
          : env,
      );
      return {
        ...state,
        envelopes: recomputeAllEnvelopes(
          updatedEnvelopes,
          state.transactions,
          state.transfers,
        ),
      };
    }

    case "TRANSFER_FUNDS": {
      const newTransfer: DemoTransfer = {
        id: crypto.randomUUID(),
        fromEnvelopeId: action.payload.fromEnvelopeId,
        toEnvelopeId: action.payload.toEnvelopeId,
        amountCents: action.payload.amountCents,
        weekStart: "", // not needed for demo
      };
      const updatedTransfers = [...state.transfers, newTransfer];
      return {
        ...state,
        transfers: updatedTransfers,
        envelopes: recomputeAllEnvelopes(
          state.envelopes,
          state.transactions,
          updatedTransfers,
        ),
      };
    }

    case "ADD_INCOME_ENTRY": {
      const newEntry: DemoIncomeEntry = {
        id: crypto.randomUUID(),
        ...action.payload,
      };
      return {
        ...state,
        incomeEntries: [...state.incomeEntries, newEntry],
      };
    }

    case "DELETE_INCOME_ENTRY": {
      return {
        ...state,
        incomeEntries: state.incomeEntries.filter(
          (e) => e.id !== action.payload.id,
        ),
      };
    }

    case "UPDATE_PROFILE": {
      return { ...state, profile: action.payload };
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
    transfers: [],
    incomeEntries: DEMO_INCOME_ENTRIES,
    profile: DEMO_PROFILE,
    historicalTransactions: DEMO_HISTORICAL_TRANSACTIONS,
    historicalIncome: DEMO_HISTORICAL_INCOME,
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
