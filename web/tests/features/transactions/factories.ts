import type { Transaction } from "@/features/transactions/types";

export function makeTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "1",
    account: { id: "1", name: "Amazon", type: "gift_card" },
    amount: "-12.50",
    description: "Coffee",
    occurred_on: "2026-09-28",
    created_at: "2026-09-28T00:00:00Z",
    updated_at: "2026-09-28T00:00:00Z",
    ...overrides,
  };
}
