import type { ReactNode } from "react";
import { Skeleton, Text, UnstyledButton } from "@mantine/core";
import { AccountDisplayName } from "@/features/accounts/AccountDisplayName";
import { accountLabelText } from "@/features/accounts/labels";
import type { AccountLabel } from "@/features/accounts/types";
import { formatDate } from "@/lib/format";
import classes from "./TransactionsList.module.css";
import { SKELETON_ROW_COUNT } from "./constants";
import { describeSignedAmount } from "./format";
import type { Transaction } from "./types";

type TransactionRowProps = {
  transaction: Transaction;
  accountLabel: AccountLabel;
};

type SelectTransactionProps = {
  onSelect: (transaction: Transaction) => void;
};

function TransactionsListFrame({ children }: { children: ReactNode }) {
  return <ul className={classes.list}>{children}</ul>;
}

function SecondaryLine({ children }: { children: ReactNode }) {
  return (
    <Text span size="sm" c="dimmed" truncate>
      {children}
    </Text>
  );
}

function DescribedDetails({
  transaction,
  accountLabel,
}: TransactionRowProps) {
  return (
    <>
      <Text span fw={500} truncate>
        {transaction.description}
      </Text>
      <SecondaryLine>
        {accountLabelText(accountLabel)} · {formatDate(transaction.occurred_on)}
      </SecondaryLine>
    </>
  );
}

function UndescribedDetails({
  transaction,
  accountLabel,
}: TransactionRowProps) {
  return (
    <>
      <AccountDisplayName label={accountLabel} span fw={500} />
      <SecondaryLine>{formatDate(transaction.occurred_on)}</SecondaryLine>
    </>
  );
}

function SignedAmount({ amount }: { amount: string }) {
  const { label, inflow } = describeSignedAmount(amount);
  return (
    <Text
      span
      fw={600}
      c={inflow ? "green" : undefined}
      className={classes.amount}
    >
      {label}
    </Text>
  );
}

function TransactionListRow({
  transaction,
  accountLabel,
  onSelect,
}: TransactionRowProps & SelectTransactionProps) {
  const Details = transaction.description
    ? DescribedDetails
    : UndescribedDetails;
  return (
    <li className={classes.item}>
      <UnstyledButton
        className={classes.row}
        onClick={() => onSelect(transaction)}
      >
        <span className={classes.details}>
          <Details transaction={transaction} accountLabel={accountLabel} />
        </span>
        <SignedAmount amount={transaction.amount} />
      </UnstyledButton>
    </li>
  );
}

export function TransactionsList({
  transactions,
  accountLabel,
  onSelect,
}: {
  transactions: Transaction[];
  accountLabel: (account: Transaction["account"]) => AccountLabel;
} & SelectTransactionProps) {
  return (
    <TransactionsListFrame>
      {transactions.map((transaction) => (
        <TransactionListRow
          key={transaction.id}
          transaction={transaction}
          accountLabel={accountLabel(transaction.account)}
          onSelect={onSelect}
        />
      ))}
    </TransactionsListFrame>
  );
}

export function TransactionsListSkeleton() {
  return (
    <TransactionsListFrame>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, row) => (
        <li key={row} className={`${classes.item} ${classes.row}`}>
          <span className={classes.details}>
            <Skeleton height={14} width={160} radius="xl" />
            <Skeleton height={12} width={120} radius="xl" />
          </span>
          <Skeleton height={14} width={64} radius="xl" />
        </li>
      ))}
    </TransactionsListFrame>
  );
}
