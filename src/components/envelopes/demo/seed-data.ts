import { addDays, format, startOfWeek } from "date-fns";

// ---------------------------------------------------------------------------
// Demo types (no Firestore Timestamps, no userId)
// ---------------------------------------------------------------------------

export type DemoEnvelope = {
  id: string;
  title: string;
  weeklyBudgetCents: number;
  sortOrder: number;
  rollover: boolean;
  spentCents: number;
  remainingCents: number;
  status: "On Track" | "Watch" | "Over";
};

export type DemoTransaction = {
  id: string;
  envelopeId: string;
  amountCents: number;
  date: string;
  merchant?: string;
  description?: string;
};

// ---------------------------------------------------------------------------
// Seed data — current week dates computed dynamically
// ---------------------------------------------------------------------------

const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
function weekDay(offset: number): string {
  return format(addDays(weekStart, offset), "yyyy-MM-dd");
}

export const DEMO_ENVELOPES: DemoEnvelope[] = [
  {
    id: "demo-env-1",
    title: "Groceries",
    weeklyBudgetCents: 15000,
    sortOrder: 1,
    rollover: false,
    spentCents: 8700,
    remainingCents: 6300,
    status: "On Track",
  },
  {
    id: "demo-env-2",
    title: "Dining Out",
    weeklyBudgetCents: 7500,
    sortOrder: 2,
    rollover: false,
    spentCents: 6200,
    remainingCents: 1300,
    status: "Watch",
  },
  {
    id: "demo-env-3",
    title: "Gas",
    weeklyBudgetCents: 5000,
    sortOrder: 3,
    rollover: false,
    spentCents: 5500,
    remainingCents: -500,
    status: "Over",
  },
  {
    id: "demo-env-4",
    title: "Entertainment",
    weeklyBudgetCents: 4000,
    sortOrder: 4,
    rollover: true,
    spentCents: 1500,
    remainingCents: 2500,
    status: "On Track",
  },
  {
    id: "demo-env-5",
    title: "Coffee",
    weeklyBudgetCents: 2500,
    sortOrder: 5,
    rollover: false,
    spentCents: 1200,
    remainingCents: 1300,
    status: "On Track",
  },
];

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: "demo-txn-1",
    envelopeId: "demo-env-1",
    amountCents: 4250,
    date: weekDay(0),
    merchant: "Kroger",
    description: "Weekly grocery run",
  },
  {
    id: "demo-txn-2",
    envelopeId: "demo-env-1",
    amountCents: 4450,
    date: weekDay(2),
    merchant: "Trader Joe's",
  },
  {
    id: "demo-txn-3",
    envelopeId: "demo-env-2",
    amountCents: 3200,
    date: weekDay(1),
    merchant: "Chipotle",
    description: "Lunch with coworkers",
  },
  {
    id: "demo-txn-4",
    envelopeId: "demo-env-2",
    amountCents: 3000,
    date: weekDay(3),
    merchant: "Thai Palace",
  },
  {
    id: "demo-txn-5",
    envelopeId: "demo-env-3",
    amountCents: 2800,
    date: weekDay(0),
    merchant: "Shell",
    description: "Fill-up",
  },
  {
    id: "demo-txn-6",
    envelopeId: "demo-env-3",
    amountCents: 2700,
    date: weekDay(3),
    merchant: "BP",
  },
  {
    id: "demo-txn-7",
    envelopeId: "demo-env-4",
    amountCents: 1500,
    date: weekDay(2),
    merchant: "Netflix",
    description: "Monthly subscription",
  },
  {
    id: "demo-txn-8",
    envelopeId: "demo-env-5",
    amountCents: 650,
    date: weekDay(1),
    merchant: "Starbucks",
  },
  {
    id: "demo-txn-9",
    envelopeId: "demo-env-5",
    amountCents: 550,
    date: weekDay(3),
    merchant: "Local Coffee Co",
  },
];
