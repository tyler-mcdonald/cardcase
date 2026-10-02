import { localDateString } from "@/lib/format";
import type { Transaction, TransactionInput, TransactionUpdate } from "./types";

export type Amount = string | number;

export type TransactionFormValues = {
  accountId: string | null;
  occurredOn: string | null;
  description: string;
  outflow: Amount;
  inflow: Amount;
};

function isPositive(amount: Amount): boolean {
  return Number(amount) > 0;
}

export function validateTransactionForm({
  accountId,
  occurredOn,
  outflow,
  inflow,
}: TransactionFormValues) {
  const hasAccount = Boolean(accountId);
  const hasDate = Boolean(occurredOn);
  const hasAmount = isPositive(outflow) || isPositive(inflow);

  return {
    accountId: hasAccount ? null : "Account is required",
    occurredOn: hasDate ? null : "Date is required",
    amount: hasAmount ? null : "Enter either an outflow or an inflow",
  };
}

function signedAmount({ outflow, inflow }: TransactionFormValues): string {
  return (Number(inflow) - Number(outflow)).toFixed(2);
}

export function toTransactionInput(
  values: TransactionFormValues,
): TransactionInput {
  return {
    amount: signedAmount(values),
    description: values.description.trim(),
    occurred_on: values.occurredOn!,
  };
}

export function emptyTransactionForm(): TransactionFormValues {
  return {
    accountId: null,
    occurredOn: localDateString(new Date()),
    description: "",
    outflow: "",
    inflow: "",
  };
}

export function transactionFormFrom(
  transaction: Transaction,
): TransactionFormValues {
  const amount = Number(transaction.amount);
  const magnitude = Math.abs(amount).toFixed(2);
  return {
    accountId: transaction.account.id,
    occurredOn: transaction.occurred_on,
    description: transaction.description,
    outflow: amount < 0 ? magnitude : "",
    inflow: amount > 0 ? magnitude : "",
  };
}

export function changedFields(
  transaction: Transaction,
  input: TransactionInput,
): TransactionUpdate {
  const changes: TransactionUpdate = {};
  if (Number(input.amount) !== Number(transaction.amount)) {
    changes.amount = input.amount;
  }
  if (input.description !== transaction.description) {
    changes.description = input.description;
  }
  if (input.occurred_on !== transaction.occurred_on) {
    changes.occurred_on = input.occurred_on;
  }
  return changes;
}
