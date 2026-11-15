import type { Account } from "@/features/accounts/types";

export type Transaction = {
  id: string;
  account: Pick<Account, "id" | "name" | "type">;
  amount: string;
  description: string;
  occurred_on: string;
  created_at: string;
  updated_at: string;
};

export type TransactionInput = Pick<
  Transaction,
  "amount" | "description" | "occurred_on"
>;

export type TransactionUpdate = Partial<TransactionInput>;
