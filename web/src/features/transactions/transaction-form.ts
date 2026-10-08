import { localDateString, toTwoDecimalString } from "@/lib/format";
import { splitSignedAmount } from "./format";
import type { Transaction, TransactionInput, TransactionUpdate } from "./types";

export type Amount = string | number;

export type TransactionFormValues = {
  accountId: string | null;
  occurredOn: string | null;
  description: string;
  outflow: Amount;
  inflow: Amount;
};

export type TransactionField = keyof TransactionFormValues;

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
  return toTwoDecimalString(Number(inflow) - Number(outflow));
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
  const { outflow, inflow } = splitSignedAmount(transaction.amount);
  return {
    accountId: transaction.account.id,
    occurredOn: transaction.occurred_on,
    description: transaction.description,
    outflow: outflow === null ? "" : toTwoDecimalString(outflow),
    inflow: inflow === null ? "" : toTwoDecimalString(inflow),
  };
}

function isSameValue(
  field: keyof TransactionInput,
  a: string,
  b: string,
): boolean {
  return field === "amount" ? Number(a) === Number(b) : a === b;
}

export function changedFields(
  transaction: Transaction,
  input: TransactionInput,
): TransactionUpdate {
  const fields = Object.keys(input) as (keyof TransactionInput)[];
  return Object.fromEntries(
    fields
      .filter((field) => !isSameValue(field, input[field], transaction[field]))
      .map((field) => [field, input[field]]),
  );
}
