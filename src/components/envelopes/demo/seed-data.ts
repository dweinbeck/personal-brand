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

export type DemoProfile = {
  averageWeeklyIncomeCents: number;
  averageWeeklyBillsCents: number;
  targetWeeklySavingsCents: number;
};

export type DemoTransfer = {
  id: string;
  fromEnvelopeId: string;
  toEnvelopeId: string;
  amountCents: number;
  weekStart: string;
};

export type DemoIncomeEntry = {
  id: string;
  amountCents: number;
  description: string;
  date: string;
};

// ---------------------------------------------------------------------------
// Seed data — current week dates computed dynamically
// ---------------------------------------------------------------------------

const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
function weekDay(offset: number): string {
  return format(addDays(weekStart, offset), "yyyy-MM-dd");
}

function priorWeekDay(weeksAgo: number, dayOffset: number): string {
  const priorWeekStart = addDays(weekStart, -(weeksAgo * 7));
  return format(addDays(priorWeekStart, dayOffset), "yyyy-MM-dd");
}

export const DEMO_PROFILE: DemoProfile = {
  averageWeeklyIncomeCents: 200000, // $2,000/week
  averageWeeklyBillsCents: 120000, // $1,200/week
  targetWeeklySavingsCents: 30000, // $300/week
};

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

export const DEMO_INCOME_ENTRIES: DemoIncomeEntry[] = [
  {
    id: "demo-income-1",
    amountCents: 3000,
    description: "Sold old speaker",
    date: weekDay(1),
  },
  {
    id: "demo-income-2",
    amountCents: 2500,
    description: "Freelance task",
    date: weekDay(3),
  },
];

// Historical data for analytics charts
export const DEMO_HISTORICAL_TRANSACTIONS: DemoTransaction[] = [
  // Week -2 (two weeks ago)
  {
    id: "demo-hist-1",
    envelopeId: "demo-env-1",
    amountCents: 12000,
    date: priorWeekDay(2, 1),
    merchant: "Kroger",
  },
  {
    id: "demo-hist-2",
    envelopeId: "demo-env-2",
    amountCents: 5000,
    date: priorWeekDay(2, 2),
    merchant: "Olive Garden",
  },
  {
    id: "demo-hist-3",
    envelopeId: "demo-env-3",
    amountCents: 4500,
    date: priorWeekDay(2, 0),
    merchant: "Shell",
  },
  {
    id: "demo-hist-4",
    envelopeId: "demo-env-4",
    amountCents: 2000,
    date: priorWeekDay(2, 3),
    merchant: "AMC",
  },
  {
    id: "demo-hist-5",
    envelopeId: "demo-env-5",
    amountCents: 1800,
    date: priorWeekDay(2, 1),
    merchant: "Starbucks",
  },
  // Week -1 (last week)
  {
    id: "demo-hist-6",
    envelopeId: "demo-env-1",
    amountCents: 14000,
    date: priorWeekDay(1, 0),
    merchant: "Trader Joe's",
  },
  {
    id: "demo-hist-7",
    envelopeId: "demo-env-2",
    amountCents: 7000,
    date: priorWeekDay(1, 2),
    merchant: "Chipotle",
  },
  {
    id: "demo-hist-8",
    envelopeId: "demo-env-3",
    amountCents: 3500,
    date: priorWeekDay(1, 1),
    merchant: "BP",
  },
  {
    id: "demo-hist-9",
    envelopeId: "demo-env-4",
    amountCents: 3000,
    date: priorWeekDay(1, 4),
    merchant: "Steam",
  },
  {
    id: "demo-hist-10",
    envelopeId: "demo-env-5",
    amountCents: 2200,
    date: priorWeekDay(1, 3),
    merchant: "Local Coffee Co",
  },
];

export const DEMO_HISTORICAL_INCOME: DemoIncomeEntry[] = [
  {
    id: "demo-hist-inc-1",
    amountCents: 5000,
    description: "Garage sale",
    date: priorWeekDay(1, 2),
  },
];
