import type { Account } from "@/features/accounts/types";

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "1",
    name: "Amazon",
    description: "",
    type: "gift_card",
    expires_on: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}
